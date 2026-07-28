"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DurationUnit = "minutes" | "hours" | "days";

const UNIT_TO_MINUTES: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

// Backend caps every duration field at 1440 minutes (1 day) — clamp the numeric
// input's max per unit so the value can never convert to something the API rejects.
const MAX_MINUTES = 1440;
function maxFor(unit: DurationUnit) {
  return Math.floor(MAX_MINUTES / UNIT_TO_MINUTES[unit]);
}

function toMinutes(value: number, unit: DurationUnit) {
  return Math.round(value * UNIT_TO_MINUTES[unit]);
}

function DurationField({
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  label: string;
  value: number;
  unit: DurationUnit;
  onValueChange: (value: number) => void;
  onUnitChange: (unit: DurationUnit) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold">
      {label}
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={maxFor(unit)}
          value={value}
          required
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="ink-border w-full rounded-lg bg-bg px-3 py-2 font-normal"
        />
        <select
          value={unit}
          onChange={(e) => {
            const nextUnit = e.target.value as DurationUnit;
            onUnitChange(nextUnit);
            const clampedMax = maxFor(nextUnit);
            if (value > clampedMax) onValueChange(clampedMax);
          }}
          className="ink-border rounded-lg bg-bg px-3 py-2 font-normal"
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>
    </label>
  );
}

export function CreateTournamentForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [registrationValue, setRegistrationValue] = useState(1);
  const [registrationUnit, setRegistrationUnit] = useState<DurationUnit>("hours");
  const [roundValue, setRoundValue] = useState(1);
  const [roundUnit, setRoundUnit] = useState<DurationUnit>("days");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        registrationWindowMinutes: toMinutes(registrationValue, registrationUnit),
        roundDurationMinutes: toMinutes(roundValue, roundUnit),
      }),
    });

    setPending(false);
    if (!res.ok) {
      const json: { error?: unknown } = await res.json().catch(() => ({}));
      const err = json.error as
        | string
        | { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
        | undefined;
      const message =
        typeof err === "string"
          ? err
          : (err?.formErrors?.[0] ?? Object.values(err?.fieldErrors ?? {})[0]?.[0] ?? "Failed to create tournament");
      setError(message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Tournament name
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Startup Clash GE — July Cup"
          className="ink-border rounded-lg bg-bg px-3 py-2 font-normal"
        />
      </label>
      <DurationField
        label="Registration window"
        value={registrationValue}
        unit={registrationUnit}
        onValueChange={setRegistrationValue}
        onUnitChange={setRegistrationUnit}
      />
      <DurationField
        label="Round duration"
        value={roundValue}
        unit={roundUnit}
        onValueChange={setRoundValue}
        onUnitChange={setRoundUnit}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Opening..." : "Open registration window"}
      </button>
    </form>
  );
}
