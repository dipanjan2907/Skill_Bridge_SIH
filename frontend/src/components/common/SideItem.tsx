import type { ReactNode } from "react";

interface SideItemProps {
  icon: ReactNode;
  text: string;
  active?: boolean;
  badge?: string;
}

const SideItem = ({
  icon,
  text,
  active = false,
  badge,
}: SideItemProps) => {

  return (
    <div
      className={`side-item ${
        active ? "active" : ""
      }`}
    >

      {icon}

      <span>{text}</span>

      {badge && (
        <small>{badge}</small>
      )}

    </div>
  );
};

export default SideItem;