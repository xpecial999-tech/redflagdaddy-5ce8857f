import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import {
  listQuestions,
  listCategories,
  listJourneys,
  upsertQuestion,
  deleteQuestion,
  archiveQuestion,
  reorderQuestions,
  upsertCategory,
  deleteCategory,
  getAnalytics,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Dynamic Compass" }] }),
  component: AdminPanel,
});

type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "boolean"
  | "scale"
  | "slider"
  | "text"
  | "scenario";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface Option {
  label: string;
  value: string;
  score?: number;
}
interface QuestionRow {
  id: string;
  category_id: string;
  question: string;
  question_type: QuestionType;
  answer_options: Option[];
  weight: number;
  risk_level: RiskLevel;
  active: boolean;
  order_index: number;
  branch_logic: Record<string, unknown>;
}
interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
}

const riskColors: Record<RiskLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  critical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function AdminPanel() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Admin</p>
        <h1 className="text-3xl font-display font-semibold">Control panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage questions, categories, journeys, and analytics.
        </p>
      </header>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto">
          <TabsTrigger value="questions" className="text-xs sm:text-sm py-2">Questions</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm py-2">Categories</TabsTrigger>
          <TabsTrigger value="journeys" className="text-xs sm:text-sm py-2">Journeys</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4">
          <QuestionsTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="journeys" className="mt-4">
          <JourneysTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================ QUESTIONS ============================ */

function QuestionsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listQuestions);
  const catsFn = useServerFn(listCategories);
  const delFn = useServerFn(deleteQuestion);
  const arcFn = useServerFn(archiveQuestion);
  const reorderFn = useServerFn(reorderQuestions);

  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [open, setOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const cats = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => catsFn({ data: undefined as never }),
  });
  const qs = useQuery({
    queryKey: ["admin", "questions", selectedCat, risk, activeOnly, search, page],
    queryFn: () =>
      listFn({
        data: {
          includeInactive: !activeOnly,
          limit: pageSize,
          offset: page * pageSize,
          ...(selectedCat !== "all" ? { category_id: selectedCat } : {}),
          ...(risk !== "all" ? { risk_level: risk as RiskLevel } : {}),
          ...(search ? { search } : {}),
        },
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "questions"] });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Question deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      arcFn({ data: { id, active } }),
    onSuccess: () => invalidate(),
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; order_index: number }[]) =>
      reorderFn({ data: { items } }),
    onSuccess: () => invalidate(),
  });

  const questions = (qs.data?.questions ?? []) as unknown as QuestionRow[];
  const total = qs.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const categories = (cats.data?.categories ?? []) as CategoryRow[];

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...questions];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorder.mutate(next.map((q, i) => ({ id: q.id, order_index: i + page * pageSize })));
  };

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-3 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search question text…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={selectedCat} onValueChange={resetPage(setSelectedCat)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={resetPage(setRisk)}>
            <SelectTrigger>
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {(["low", "medium", "high", "critical"] as RiskLevel[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-2 px-3 rounded-md border border-input">
            <Label className="text-xs">Active only</Label>
            <Switch checked={activeOnly} onCheckedChange={resetPage(setActiveOnly)} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {total} result{total === 1 ? "" : "s"}
          </span>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> New question
              </Button>
            </DialogTrigger>
            <QuestionDialog
              categories={categories}
              initial={editing}
              onSaved={() => {
                setOpen(false);
                setEditing(null);
                invalidate();
              }}
            />
          </Dialog>
        </div>
      </div>


      {qs.isLoading ? (
        <Loading />
      ) : questions.length === 0 ? (
        <Empty label="No questions yet." />
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-2xl p-4 ${q.active ? "" : "opacity-60"}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => move(i, -1)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className={riskColors[q.risk_level]}>
                      {q.risk_level}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {q.question_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      weight {q.weight}
                    </span>
                    {!q.active && (
                      <Badge variant="outline" className="text-[10px]">
                        archived
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {categories.find((c) => c.id === q.category_id)?.name ?? ""}
                    </span>
                  </div>
                  <p className="text-sm break-words">{q.question}</p>
                  {(() => {
                    const bl = (q.branch_logic ?? {}) as {
                      green_flag_indicators?: string[];
                      red_flag_indicators?: string[];
                    };
                    const g = bl.green_flag_indicators ?? [];
                    const r = bl.red_flag_indicators ?? [];
                    if (g.length === 0 && r.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {g.map((t) => (
                          <Badge
                            key={`g-${t}`}
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]"
                          >
                            + {t}
                          </Badge>
                        ))}
                        {r.map((t) => (
                          <Badge
                            key={`r-${t}`}
                            variant="outline"
                            className="bg-rose-500/10 text-rose-300 border-rose-500/30 text-[10px]"
                          >
                            ⚑ {t}
                          </Badge>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(q);
                    setOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => archive.mutate({ id: q.id, active: !q.active })}
                >
                  {q.active ? (
                    <>
                      <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5 mr-1" /> Restore
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-300 hover:text-rose-200"
                  onClick={() => {
                    if (confirm("Delete this question?")) del.mutate(q.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

function QuestionDialog({
  categories,
  initial,
  onSaved,
}: {
  categories: CategoryRow[];
  initial: QuestionRow | null;
  onSaved: () => void;
}) {
  const saveFn = useServerFn(upsertQuestion);
  const [form, setForm] = useState(() => ({
    id: initial?.id,
    category_id: initial?.category_id ?? categories[0]?.id ?? "",
    question: initial?.question ?? "",
    question_type: (initial?.question_type ?? "single_choice") as QuestionType,
    weight: initial?.weight ?? 1,
    risk_level: (initial?.risk_level ?? "low") as RiskLevel,
    active: initial?.active ?? true,
    order_index: initial?.order_index ?? 0,
    optionsText:
      initial?.answer_options
        ?.map((o) => `${o.label}|${o.value}|${o.score ?? 0}`)
        .join("\n") ?? "",
  }));

  const save = useMutation({
    mutationFn: () => {
      const answer_options: Option[] = form.optionsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [label, value, score] = l.split("|").map((s) => s.trim());
          return {
            label: label ?? "",
            value: value ?? label ?? "",
            score: score ? Number(score) : 0,
          };
        });
      return saveFn({
        data: {
          ...(form.id ? { id: form.id } : {}),
          category_id: form.category_id,
          question: form.question,
          question_type: form.question_type,
          answer_options,
          weight: Number(form.weight),
          risk_level: form.risk_level,
          active: form.active,
          order_index: Number(form.order_index),
          branch_logic: {},
        },
      });
    },
    onSuccess: () => {
      toast.success(form.id ? "Question updated" : "Question created");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{form.id ? "Edit question" : "New question"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Category</Label>
          <Select
            value={form.category_id}
            onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Question</Label>
          <Textarea
            rows={3}
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select
              value={form.question_type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, question_type: v as QuestionType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "single_choice",
                  "multi_choice",
                  "boolean",
                  "scale",
                  "slider",
                  "text",
                  "scenario",
                ].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Risk level</Label>
            <Select
              value={form.risk_level}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, risk_level: v as RiskLevel }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["low", "medium", "high", "critical"] as RiskLevel[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Weight</Label>
            <Input
              type="number"
              step="0.5"
              min={0}
              max={20}
              value={form.weight}
              onChange={(e) =>
                setForm((f) => ({ ...f, weight: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label>Order</Label>
            <Input
              type="number"
              value={form.order_index}
              onChange={(e) =>
                setForm((f) => ({ ...f, order_index: Number(e.target.value) }))
              }
            />
          </div>
        </div>
        <div>
          <Label>Options (one per line: label|value|score)</Label>
          <Textarea
            rows={5}
            placeholder="Strongly agree|5|10"
            value={form.optionsText}
            onChange={(e) => setForm((f) => ({ ...f, optionsText: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.active}
            onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
          />
          <Label className="!mt-0">Active</Label>
          {form.risk_level === "critical" && (
            <Badge className={riskColors.critical + " ml-auto"}>
              <AlertTriangle className="w-3 h-3 mr-1" /> Critical question
            </Badge>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.question || !form.category_id}
        >
          {save.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ============================ CATEGORIES ============================ */

function CategoriesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCategories);
  const saveFn = useServerFn(upsertCategory);
  const delFn = useServerFn(deleteCategory);

  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const q = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listFn({ data: undefined as never }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "categories"] });

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          ...(editing?.id ? { id: editing.id } : {}),
          name,
          description: description || null,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      setOpen(false);
      setEditing(null);
      setName("");
      setDescription("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const cats = (q.data?.categories ?? []) as CategoryRow[];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditing(null);
              setName("");
              setDescription("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditing(null);
                setName("");
                setDescription("");
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> New category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !name}>
                {save.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? (
        <Loading />
      ) : cats.length === 0 ? (
        <Empty label="No categories yet." />
      ) : (
        <div className="space-y-2">
          {cats.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold">{c.name}</h3>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(c);
                      setName(c.name);
                      setDescription(c.description ?? "");
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-300"
                    onClick={() => {
                      if (confirm(`Delete category "${c.name}"?`)) del.mutate(c.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ JOURNEYS ============================ */

function JourneysTab() {
  const listFn = useServerFn(listJourneys);
  const [status, setStatus] = useState<string>("all");

  const q = useQuery({
    queryKey: ["admin", "journeys", status],
    queryFn: () =>
      listFn({
        data: {
          limit: 100,
          ...(status !== "all" ? { status: status as "draft" | "pending" | "in_progress" | "completed" | "expired" } : {}),
        },
      }),
  });

  const journeys = q.data?.journeys ?? [];

  const statusColors: Record<string, string> = {
    draft: "bg-white/10 text-muted-foreground",
    pending: "bg-amber-500/15 text-amber-300",
    in_progress: "bg-blue-500/15 text-blue-300",
    completed: "bg-emerald-500/15 text-emerald-300",
    expired: "bg-rose-500/15 text-rose-300",
  };

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {["draft", "pending", "in_progress", "completed", "expired"].map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {q.isLoading ? (
        <Loading />
      ) : journeys.length === 0 ? (
        <Empty label="No journeys yet." />
      ) : (
        <div className="space-y-2">
          {journeys.map((j) => (
            <div key={j.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold break-words">{j.title}</h3>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {j.recipient_email && <div>{j.recipient_email}</div>}
                    <div className="font-mono">{j.invite_code}</div>
                    <div>{new Date(j.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-1 rounded-full ${statusColors[j.status] ?? statusColors.draft}`}
                >
                  {j.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ ANALYTICS ============================ */

function AnalyticsTab() {
  const fn = useServerFn(getAnalytics);
  const q = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fn({ data: undefined as never }),
  });

  const a = q.data;

  const tiles = useMemo(() => {
    if (!a) return [];
    return [
      { label: "Safety", value: a.averages.safety },
      { label: "Compatibility", value: a.averages.compatibility },
      { label: "Green flags", value: a.averages.green },
      { label: "Red flags", value: a.averages.red },
      { label: "Experience", value: a.averages.experience },
    ];
  }, [a]);

  if (q.isLoading) return <Loading />;
  if (!a) return <Empty label="No analytics yet." />;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Total journeys" value={a.totals.journeys} />
        <Stat label="Completed" value={a.totals.completed} />
        <Stat label="In progress" value={a.totals.inProgress} />
      </section>

      <section className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold">Completion rate</h3>
          <span className="text-2xl font-display font-semibold">
            {a.completionRate.toFixed(1)}%
          </span>
        </div>
        <Progress value={a.completionRate} />
      </section>

      <section>
        <h3 className="font-display font-semibold mb-2 px-1">Average scores</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="glass rounded-2xl p-4">
              <div className="text-xs text-muted-foreground">{t.label}</div>
              <div className="text-2xl font-display font-semibold mt-1">
                {Number(t.value).toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <h3 className="font-display font-semibold mb-2">Red flag frequency</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Share of responses to critical-risk questions that triggered a red flag.
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {a.redFlag.hits} of {a.redFlag.criticalResponses} responses
          </span>
          <span className="text-2xl font-display font-semibold">
            {a.redFlag.frequency.toFixed(1)}%
          </span>
        </div>
        <Progress value={a.redFlag.frequency} />
        <div className="text-[11px] text-muted-foreground mt-2">
          {a.redFlag.criticalQuestions} active critical questions
        </div>
      </section>
    </div>
  );
}

/* ============================ Shared ============================ */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-display font-semibold mt-1">{value}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
