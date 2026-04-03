import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5 justify-center lg:justify-start">
      <Image
        src="/logo.svg"
        alt="Healplace logo"
        width={40}
        height={40}
        className="h-10 w-10 lg:h-12 lg:w-12"
        priority
      />
      <span
        className="font-bold text-xl lg:text-2xl"
        style={{ color: 'var(--brand-primary-purple)' }}
      >
        Healplace Cardio
      </span>
    </div>
  );
}
