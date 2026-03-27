import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-3 justify-center lg:justify-start">
            <Image
              src="/logo.svg"
              alt="Healplace logo"
              width={40}
              height={40}
              className="h-10 w-10 lg:h-12 lg:w-12"
              priority
            />
            {/* <span className="font-semibold text-dark-blue-500 text-xl lg:text-3xl tracking-[-0.5px]">
              Healplace
            </span> */}
          </div>
  );
}
