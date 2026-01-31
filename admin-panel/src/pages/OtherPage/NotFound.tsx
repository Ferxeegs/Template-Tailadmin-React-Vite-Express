import { useEffect } from "react";
import GridShape from "../../components/common/GridShape";

export default function NotFound() {
  // Hide body overflow when component mounts
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-white dark:bg-gray-900"
      style={{ zIndex: 99999 }}
    >
      <GridShape />
      <div className="relative z-10 mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
          ERROR
        </h1>

        <img src="/images/error/404.svg" alt="404" className="dark:hidden mx-auto" />
        <img
          src="/images/error/404-dark.svg"
          alt="404"
          className="hidden dark:block mx-auto"
        />

        <p className="mt-10 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
          We can't seem to find the page you are looking for!
        </p>
      </div>
    </div>
  );
}
