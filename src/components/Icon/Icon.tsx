import styles from "./Icon.module.css";

interface IconProps {
  name: string;
  className?: string;
  "aria-hidden"?: boolean;
}

export function Icon({ name, className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <span
      aria-hidden={ariaHidden}
      className={`${styles.icon} material-symbols-outlined ${className ?? ""}`}
    >
      {name}
    </span>
  );
}
