import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { TOP_ROLES, BOTTOM_ROLES, SWITCH_ROLES, type Role } from "@/lib/roles";

const PRIMARY: Role[] = ["Dominant", "submissive", "switch"];

const EXTRA_GROUPS: { label: string; roles: Role[] }[] = [
  { label: "Top / leading", roles: TOP_ROLES.filter((r) => !PRIMARY.includes(r)) },
  { label: "Bottom / receiving", roles: BOTTOM_ROLES.filter((r) => !PRIMARY.includes(r)) },
  { label: "Switch / fluid", roles: SWITCH_ROLES.filter((r) => !PRIMARY.includes(r)) },
];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition text-left ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-input text-muted-foreground hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}

export function RoleSelector({
  value,
  onChange,
}: {
  value: Role | "";
  onChange: (r: Role) => void;
}) {
  const isOther = value !== "" && !PRIMARY.includes(value as Role);
  const [showOther, setShowOther] = useState(isOther);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {PRIMARY.map((r) => (
          <Chip
            key={r}
            label={r}
            active={value === r}
            onClick={() => {
              setShowOther(false);
              onChange(r);
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowOther((s) => !s)}
          className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition text-left flex items-center justify-between gap-1 ${
            isOther || showOther
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-input text-muted-foreground hover:border-primary/50"
          }`}
        >
          <span className="truncate">{isOther ? value : "Other"}</span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showOther ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showOther && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 max-h-56 overflow-y-auto pr-1">
              {EXTRA_GROUPS.map((g) => (
                <div key={g.label}>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {g.label}
                  </span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {g.roles.map((r) => (
                      <Chip key={r} label={r} active={value === r} onClick={() => onChange(r)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
