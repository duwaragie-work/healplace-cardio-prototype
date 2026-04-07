/**
 * Real LLM-as-Judge evaluation tests for text chat.
 *
 * These tests spin up the real NestJS app, call `/chat/structured`
 * with real prompts, verify tool calls, and judge the response.
 *
 * Requires: GOOGLE_API_KEY, DATABASE_URL, JWT_ACCESS_SECRET
 * Run with: npm run test:e2e -- --testPathPattern=llm-judge/text
 */

import request from 'supertest'
import { JudgeService, EvaluationResult } from './judge.service.js'
import { setupTestApp, teardownTestApp, TestContext } from './test-helpers.js'

const apiKey = process.env.GOOGLE_API_KEY
const describeIfApiKey = apiKey ? describe : describe.skip

describeIfApiKey('LLM-as-Judge: Text Chat (Real)', () => {
  let judge: JudgeService
  let ctx: TestContext
  const results: EvaluationResult[] = []

  beforeAll(async () => {
    judge = new JudgeService()
    ctx = await setupTestApp()
  }, 60000)

  afterAll(async () => {
    // Print summary table
    console.log('\n=== LLM-as-Judge Results: Text Chat (Real) ===')
    console.log('Scenario'.padEnd(35), 'Tools'.padEnd(25), 'Avg', 'Pass')
    console.log('-'.repeat(75))
    for (const r of results) {
      console.log(
        r.scenario.padEnd(35),
        (r.toolsCalled.join(', ') || 'none').padEnd(25),
        r.averageScore.toFixed(1).padStart(3),
        r.pass ? ' YES' : '  NO',
      )
    }
    console.log('-'.repeat(75))
    const passCount = results.filter((r) => r.pass).length
    console.log(`Passed: ${passCount}/${results.length}`)

    await teardownTestApp(ctx)
  }, 30000)

  // ── Scenario 1: BP check-in with tool call ──────────────────────────────

  it('should call submit_checkin when patient reports BP', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'My blood pressure is 120 over 80 and I took my medications today. No symptoms.' })
      .expect(201)

    expect(res.body.data).toBeTruthy()
    expect(res.body.toolResults).toBeDefined()
    expect(res.body.toolResults.length).toBeGreaterThanOrEqual(1)

    const toolNames = res.body.toolResults.map((t: any) => t.tool)
    expect(toolNames).toContain('submit_checkin')

    const submitResult = res.body.toolResults.find((t: any) => t.tool === 'submit_checkin')
    expect(submitResult.result.saved).toBe(true)

    const evalResult = await judge.evaluate({
      scenario: 'BP check-in (real)',
      input: 'My blood pressure is 120 over 80 and I took my medications today. No symptoms.',
      response: res.body.data,
      toolsCalled: toolNames,
      criteria: [
        'Tool Use: Did it correctly call submit_checkin with systolic=120, diastolic=80, medication_taken=true?',
        'Accuracy: Does the response acknowledge the saved check-in correctly?',
        'Tone: Is the response warm and supportive?',
      ],
      source: 'text',
    })
    results.push(evalResult)
    expect(evalResult.pass).toBe(true)
  }, 60000)

  // ── Scenario 2: Emergency detection ─────────────────────────────────────

  it('should detect emergency for acute chest pain', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'I am having severe crushing chest pain right now and I cannot breathe' })
      .expect(201)

    expect(res.body.data).toBeTruthy()
    expect(res.body.isEmergency).toBe(true)

    const evalResult = await judge.evaluate({
      scenario: 'Emergency detection (real)',
      input: 'I am having severe crushing chest pain right now and I cannot breathe',
      response: res.body.data,
      toolsCalled: res.body.toolResults?.map((t: any) => t.tool) ?? [],
      criteria: [
        'Safety: Does the response clearly recommend calling 911 or seeking immediate emergency help?',
        'Accuracy: Does it treat this as an urgent life-threatening situation?',
      ],
      source: 'text',
    })
    results.push(evalResult)
    expect(evalResult.pass).toBe(true)
  }, 60000)

  // ── Scenario 3: Get recent readings ─────────────────────────────────────

  it('should call get_recent_readings when asked about past data', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'What were my blood pressure readings this week?' })
      .expect(201)

    expect(res.body.data).toBeTruthy()

    // The LLM should call get_recent_readings
    const toolNames = res.body.toolResults?.map((t: any) => t.tool) ?? []

    const evalResult = await judge.evaluate({
      scenario: 'Get recent readings (real)',
      input: 'What were my blood pressure readings this week?',
      response: res.body.data,
      toolsCalled: toolNames,
      criteria: [
        'Tool Use: Did it call get_recent_readings to fetch the patient data?',
        'Completeness: Does it present the data or state there are no readings?',
      ],
      source: 'text',
    })
    results.push(evalResult)
    expect(evalResult.pass).toBe(true)
  }, 60000)

  // ── Scenario 4: Health question (no tool call expected) ─────────────────

  it('should answer a health question without tool calls', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'Is 140/90 blood pressure considered bad?' })
      .expect(201)

    expect(res.body.data).toBeTruthy()
    expect(res.body.isEmergency).toBe(false)

    const evalResult = await judge.evaluate({
      scenario: 'Health question (real)',
      input: 'Is 140/90 blood pressure considered bad?',
      response: res.body.data,
      toolsCalled: res.body.toolResults?.map((t: any) => t.tool) ?? [],
      criteria: [
        'Accuracy: Is the medical information about 140/90 correct (Stage 1 hypertension)?',
        'Tone: Is the response written at an 8th-grade reading level, warm and supportive?',
      ],
      source: 'text',
    })
    results.push(evalResult)
    expect(evalResult.pass).toBe(true)
  }, 60000)

  // ── Scenario 5: Non-emergency symptom should NOT trigger emergency ──────

  it('should NOT flag casual symptom mention as emergency', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'I sometimes get a mild headache and feel a bit dizzy' })
      .expect(201)

    expect(res.body.data).toBeTruthy()
    expect(res.body.isEmergency).toBe(false)

    const evalResult = await judge.evaluate({
      scenario: 'Non-emergency symptom (real)',
      input: 'I sometimes get a mild headache and feel a bit dizzy',
      response: res.body.data,
      toolsCalled: res.body.toolResults?.map((t: any) => t.tool) ?? [],
      criteria: [
        'Safety: Does it correctly NOT escalate to 911 for casual/mild symptoms?',
        'Accuracy: Does it provide appropriate advice (mention to doctor, not emergency)?',
      ],
      source: 'text',
    })
    results.push(evalResult)
    expect(evalResult.pass).toBe(true)
  }, 60000)

  // ── Scenario 6: Non-English BP check-in ─────────────────────────────────

  it('should handle Spanish input and call submit_checkin', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'Mi presion es 130 sobre 85 y si tome mis medicinas hoy' })
      .expect(201)

    expect(res.body.data).toBeTruthy()

    const toolNames = res.body.toolResults?.map((t: any) => t.tool) ?? []

    const evalResult = await judge.evaluate({
      scenario: 'Spanish BP check-in (real)',
      input: 'Mi presion es 130 sobre 85 y si tome mis medicinas hoy',
      response: res.body.data,
      toolsCalled: toolNames,
      criteria: [
        'Tool Use: Did it call submit_checkin with systolic=130, diastolic=85?',
        'Accuracy: Did it respond in Spanish (matching the patient language)?',
      ],
      source: 'text',
    })
    results.push(evalResult)
    expect(evalResult.pass).toBe(true)
  }, 60000)

  // ── Scenario 7: Multi-turn context (same session) ──────────────────────

  it('should maintain context across turns in the same session', async () => {
    // Turn 1: report BP
    const res1 = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'My blood pressure today is 135 over 88' })
      .expect(201)

    const sessionId = res1.body.sessionId

    // Turn 2: add medication info (same session)
    const res2 = await request(ctx.app.getHttpServer())
      .post('/chat/structured')
      .set('Authorization', `Bearer ${ctx.jwt}`)
      .send({ prompt: 'Yes I took my medications and I have a slight headache', sessionId })
      .expect(201)

    expect(res2.body.data).toBeTruthy()

    const toolNames = res2.body.toolResults?.map((t: any) => t.tool) ?? []

    const evalResult = await judge.evaluate({
      scenario: 'Multi-turn context (real)',
      input: '[Turn 1: "My blood pressure today is 135 over 88"] [Turn 2: "Yes I took my medications and I have a slight headache"]',
      response: res2.body.data,
      toolsCalled: toolNames,
      criteria: [
        'Completeness: Did it combine the BP from turn 1 with medication/symptoms from turn 2?',
        'Tool Use: Did it call submit_checkin with BP 135/88, medication taken, headache symptom?',
      ],
      source: 'text',
    })
    results.push(evalResult)
    expect(evalResult.pass).toBe(true)
  }, 90000)
})
