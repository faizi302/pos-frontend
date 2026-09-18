import { Check, Monitor, Moon, Sun } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Card from "@/components/ui/Card";
import { useTheme } from "@/themes/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";

const appearanceOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeSettings() {
  const { appearance, setAppearance, businessThemeId, setBusinessThemeId, availableThemes } = useTheme();
  const { isSuperAdmin } = usePermissions();

  return (
    <div>
      <PageHeader
        title="Theme"
        description="Personalize how the platform looks. Business themes apply platform-wide once selected."
      />

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-primary">Appearance</h2>
        <p className="mt-1 text-sm text-secondary">Choose how the interface should look on this device.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {appearanceOptions.map((opt) => {
            const Icon = opt.icon;
            const active = appearance === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAppearance(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
                  active
                    ? "border-[var(--action-primary)] bg-brand/10"
                    : "border-primary hover:bg-muted-action"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-[var(--action-primary)]" : "text-secondary"}`} />
                <span className="text-sm font-medium text-primary">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-primary">Business Theme</h2>
        <p className="mt-1 text-sm text-secondary">
          {isSuperAdmin
            ? "Create and manage business themes. (Theme creation/editing needs a backend Theme API, not yet available — this preview is frontend-only for now.)"
            : "Apply one of the themes made available by your Super Admin."}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableThemes.map((theme) => {
            const active = businessThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setBusinessThemeId(theme.id)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-[var(--action-primary)] bg-brand/10"
                    : "border-primary hover:bg-muted-action"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-6 w-6 rounded-full border border-primary"
                    style={{ backgroundColor: theme.swatch }}
                  />
                  <span className="text-sm font-medium text-primary">{theme.name}</span>
                </div>
                {active && <Check className="h-4 w-4 text-[var(--action-primary)]" />}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
