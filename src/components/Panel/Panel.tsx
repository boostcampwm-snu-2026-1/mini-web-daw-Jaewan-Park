import type { ReactNode } from "react";

import styles from "./Panel.module.css";

interface PanelProps {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, eyebrow, actions, children, className }: PanelProps) {
  return (
    <section className={`${styles.panel} ${className ?? ""}`}>
      <header className={styles.header}>
        <div>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          {title ? <h2 className={styles.title}>{title}</h2> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
