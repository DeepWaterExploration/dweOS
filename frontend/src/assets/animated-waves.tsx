import { cn } from "@/lib/utils";

const WaveSvg = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 204 67"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="none"
  >
    <path
      d="M 65.6894,0.0864994 C 28.5067,-1.64172 0.0478516,19.6193 0.0478516,19.6193 L 1.09889,21.1922 c 0,0 59.00611,-44.2842 117.77111,1.2109 12.539,9.7122 24.701,13.1361 36.084,12.3591 11.383,-0.777 21.956,-5.7227 31.446,-12.5857 l -1.027,-1.5912 c -9.306,6.73 -19.576,11.5043 -30.536,12.2524 C 143.879,33.5857 132.2,30.3384 119.947,20.8484 101.294,6.40742 82.5895,0.871549 65.6875,0.0862349 Z"
      fill="currentColor"
    />
    <path
      d="M 63.3252,7.59303 C 28.9311,6.46522 3.39453,26.0566 3.39453,26.0566 L 16.8218,48.072 c 0,0 39.4497,-32.5165 84.6862,0.2995 h 0.003 c 28.089,20.3648 54.261,20.9128 72.564,15.5329 18.303,-5.3792 29.839,-16.7156 29.839,-16.7156 L 188.489,26.9414 c 0,0 -7.157,7.1438 -20.295,11.0049 -13.137,3.8609 -31.152,4.4079 -54.044,-12.1872 l -0.002,-0.0026 C 96.4211,12.8976 78.9578,8.10502 63.3252,7.59303 Z"
      fill="currentColor"
    />
  </svg>
);

export function AnimatedWaves({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-32 h-32 flex items-end", className)}>
      {/* bob animation */}
      <style>
        {`
          @keyframes bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          .animate-bob {
            animation: bob 3s ease-in-out infinite;
          }
        `}
      </style>

      {/* top wave */}
      <div
        className="absolute bottom-20 left-0 text-primary/50 animate-bob"
        style={{ animationDuration: "5s", animationDelay: "0s" }}
      >
        <WaveSvg className="w-full h-full" />
      </div>

      {/* mid wave */}
      <div
        className="absolute bottom-10 left-0 text-primary/75 animate-bob"
        style={{ animationDuration: "5s", animationDelay: "-0.5s" }}
      >
        <WaveSvg className="w-full h-full" />
      </div>

      {/* bot wave */}
      <div
        className="absolute bottom-0 left-0 text-primary animate-bob"
        style={{ animationDuration: "5s", animationDelay: "-1s" }}
      >
        <WaveSvg className="w-full h-full" />
      </div>
    </div>
  );
}
