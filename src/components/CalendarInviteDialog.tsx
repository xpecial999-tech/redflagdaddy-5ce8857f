import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { AnalysisPayload } from "@/lib/analysis.functions";
import {
  buildCalendarInvite,
  collectConversationTopics,
  downloadCalendarInvite,
  topicsCalendarDescription,
} from "@/lib/calendar-invite";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TITLE_PRESETS = ["Private conversation", "Consent check-in", "Aftercare debrief"];

function defaultStart(): string {
  const value = new Date(Date.now() + 24 * 60 * 60 * 1000);
  value.setMinutes(0, 0, 0);
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CalendarInviteDialog({ analysis }: { analysis: AnalysisPayload }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Private conversation");
  const [start, setStart] = useState(defaultStart);
  const [duration, setDuration] = useState("60");
  const [includeTopics, setIncludeTopics] = useState(false);
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const topics = useMemo(() => collectConversationTopics(analysis), [analysis]);
  const selectedTopics = topics.filter((topic) => !excludedTopics.includes(topic));

  const download = () => {
    const startDate = new Date(start);
    if (!start || !Number.isFinite(startDate.getTime())) {
      setError("Choose a valid date and time.");
      return;
    }
    setError(null);
    const content = buildCalendarInvite({
      title,
      start: startDate,
      durationMinutes: Number(duration),
      description: includeTopics ? topicsCalendarDescription(selectedTopics) : undefined,
      uid: `${crypto.randomUUID()}@redflagdaddy.com`,
    });
    downloadCalendarInvite("private-conversation.ics", content);
    setOpen(false);
    toast.success("Private calendar invite saved", {
      description: includeTopics
        ? "Review the topics before adding the event to a shared calendar."
        : "No journey name, scores or report details were included.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarDays className="h-4 w-4 mr-1.5" /> Schedule conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Private calendar invite</DialogTitle>
          <DialogDescription>
            The file is created on this device. Its discreet default title does not expose the
            journey or RedFlagDaddy on a calendar or lock screen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span>Event title</span>
            <Input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2" aria-label="Discreet event title suggestions">
            {TITLE_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTitle(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
          <label className="block space-y-1.5 text-sm">
            <span>Date and time</span>
            <Input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span>Duration</span>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </label>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <Checkbox
              checked={includeTopics}
              onCheckedChange={(checked) => setIncludeTopics(checked === true)}
              aria-label="Include private conversation topics"
            />
            <span>
              Include selected private conversation topics in the event description.
              Leave this off for shared or lock-screen calendars.
            </span>
          </label>
          {includeTopics && topics.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3" aria-live="polite">
              <p className="mb-2 text-xs font-medium text-foreground">
                These topics will be included:
              </p>
              <ul className="max-h-36 list-disc space-y-1 overflow-y-auto pl-4 text-xs text-muted-foreground">
                {topics.map((topic) => (
                  <li key={topic} className="list-none">
                    <label className="flex items-start gap-2">
                      <Checkbox
                        checked={!excludedTopics.includes(topic)}
                        onCheckedChange={(checked) => setExcludedTopics((current) =>
                          checked === true
                            ? current.filter((item) => item !== topic)
                            : current.includes(topic) ? current : [...current, topic]
                        )}
                        aria-label={`Include topic: ${topic}`}
                      />
                      <span>{topic}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {selectedTopics.length} of {topics.length} topics selected.
              </p>
            </div>
          )}
          {includeTopics && topics.length === 0 && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              No private conversation topics are available to include.
            </p>
          )}
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" onClick={download}>Download calendar file</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
