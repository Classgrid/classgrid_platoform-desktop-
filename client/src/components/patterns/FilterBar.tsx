import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const filterSchema = z.object({
  query: z.string().trim().optional()
});

type FilterValues = z.infer<typeof filterSchema>;

export function FilterBar() {
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: { query: "" }
  });

  return (
    <form className="filter-bar" onSubmit={form.handleSubmit(() => undefined)}>
      <input placeholder="Search" {...form.register("query")} />
      <button type="submit">Apply</button>
    </form>
  );
}
