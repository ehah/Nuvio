import { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  "data-nuvio-id"?: string;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className, "data-nuvio-id": dataNuvioId }) => {
  return (
    <label
      htmlFor={htmlFor}
      data-nuvio-id={dataNuvioId}
      className={clsx(
        twMerge(
          "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400",
          className,
        ),
      )}
    >
      {children}
    </label>
  );
};

export default Label;
