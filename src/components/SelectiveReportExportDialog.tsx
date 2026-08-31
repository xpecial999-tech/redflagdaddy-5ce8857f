import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildSelectedDimensionsMarkdown,
  downloadMarkdown,
  SELECTABLE_REPORT_DIMENSIONS,
  type ReportExportInput,
  type SelectableReportDimension,
} from "@/lib/report-export";

type Props = {
  input: ReportExportInput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SelectiveReportExportDialog({ input, open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<SelectableReportDimension[]>([]);

  const toggle = (key: SelectableReportDimension, checked: boolean) => {
    setSelected((current) =>
      checked
        ? current.includes(key) ? current : [...current, key]
        : current.filter((item) => item !== key),
    );
  };

  const download = () => {
    if (selected.length === 0) return;
    downloadMarkdown(
      "selected-report-dimensions.md",
      buildSelectedDimensionsMarkdown(input, selected),
    );
    onOpenChange(false);
    toast.success("Selected report dimensions saved", {
      description: "Only the dimensions you reviewed and selected were included.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose report dimensions</DialogTitle>
          <DialogDescription>
            Nothing is selected by default. Read the list before creating this private file.
            Readiness, overall notes, contacts, access links and raw answers are always omitted.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-3">
          <legend className="sr-only">Dimensions to include</legend>
          {SELECTABLE_REPORT_DIMENSIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <Checkbox
                checked={selected.includes(key)}
                onCheckedChange={(checked) => toggle(key, checked === true)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {selected.length} of {SELECTABLE_REPORT_DIMENSIONS.length} dimensions selected.
        </p>
        <DialogFooter>
          <Button type="button" onClick={download} disabled={selected.length === 0}>
            Download selected dimensions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
