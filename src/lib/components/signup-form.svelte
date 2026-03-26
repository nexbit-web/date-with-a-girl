<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { cn } from "$lib/utils.js";
  import type { ComponentProps } from "svelte";

  let { ...restProps }: ComponentProps<typeof Card.Root> = $props();

  type Step = "invite" | "decline" | "done-yes" | "done-no";

  // Генеруємо 14 днів починаючи з завтра
  function getAvailableDates() {
    const dates: { label: string; value: string; day: string }[] = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const value = d.toISOString().split("T")[0];
      const day = d.toLocaleDateString("uk-UA", { weekday: "short" });
      const label = d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
      dates.push({ value, label, day });
    }
    return dates;
  }

  const availableDates = getAvailableDates();
   const times = ["15:00","16:00","16:30","17:00","17:30","18:00","18:30","19:00"];
  const declineReasons = ["Зайнята цього дня", "Не готова поки", "Хочу інший день", "Інша причина"];

  let step = $state<Step>("invite");
  let loading = $state(false);

  let selectedDate = $state("");
  let selectedTime = $state("");
  let message = $state("");
  let errors = $state({ date: false, time: false });

  let declineReason = $state("");
  let declineMessage = $state("");
  let declineErrors = $state({ reason: false });

  function validateInvite() {
    errors = { date: !selectedDate, time: !selectedTime };
    return !!selectedDate && !!selectedTime;
  }

  function validateDecline() {
    declineErrors = { reason: !declineReason };
    return !!declineReason;
  }

  async function submitYes() {
    if (!validateInvite()) return;
    loading = true;
    try {
      await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepted: true,
          selectedDate,
          selectedTime,
          message: message.trim(),
        }),
      });
    } catch {}
    step = "done-yes";
    loading = false;
  }

  async function submitDecline() {
    if (!validateDecline()) return;
    loading = true;
    try {
      await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepted: false,
          declineReason,
          declineMessage: declineMessage.trim(),
        }),
      });
    } catch {}
    step = "done-no";
    loading = false;
  }
</script>

<Card.Root {...restProps}>

  <!-- ── ЗАПРОШЕННЯ ── -->
  {#if step === "invite"}
    <Card.Header class="text-center">
      <div class="mb-2 text-2xl">🌹</div>
      <Card.Title>Запрошення на побачення</Card.Title>
      <Card.Description>
        Обери зручну дату — і я зустріну тебе з усмішкою
      </Card.Description>
    </Card.Header>

    <Card.Content>
      <form onsubmit={(e) => { e.preventDefault(); submitYes(); }}>
        <Field.Group>

          <!-- Вибір дати — скролл-карусель -->
          <Field.Field>
            <Field.Label>Дата побачення</Field.Label>
            <div class="mt-1 flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
              {#each availableDates as d}
                <button
                  type="button"
                  onclick={() => { selectedDate = d.value; errors.date = false; }}
                  class={cn(
                    "snap-start flex-shrink-0 flex flex-col items-center justify-center",
                    "w-14 h-16 rounded-xl border text-sm transition-all",
                    selectedDate === d.value
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                  )}
                >
                  <span class="text-[10px] uppercase tracking-wide opacity-70">{d.day}</span>
                  <span class="text-base font-medium leading-none mt-1">
                    {d.label.split(" ")[0]}
                  </span>
                  <span class="text-[10px] opacity-60">{d.label.split(" ")[1]}</span>
                </button>
              {/each}
            </div>
            {#if errors.date}
              <Field.Description class="text-destructive">
                Обери дату
              </Field.Description>
            {/if}
          </Field.Field>

          <!-- Час -->
          <Field.Field>
            <Field.Label>Зручний час</Field.Label>
            <div class="grid grid-cols-4 gap-2 mt-1">
              {#each times as t}
                <Button
                  type="button"
                  variant={selectedTime === t ? "default" : "outline"}
                  size="sm"
                  onclick={() => { selectedTime = t; errors.time = false; }}
                >
                  {t}
                </Button>
              {/each}
            </div>
            {#if errors.time}
              <Field.Description class="text-destructive">
                Обери зручний час
              </Field.Description>
            {/if}
          </Field.Field>

          <!-- Побажання -->
          <Field.Field>
            <Field.Label for="message">Слова для нього</Field.Label>
            <Textarea
              id="message"
              bind:value={message}
              placeholder="Напиши щось від серця... або залиш таємницю ✨"
              rows={3}
            />
            <Field.Description>Необов'язково</Field.Description>
          </Field.Field>

          <!-- Кнопки -->
          <Field.Field class="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={loading} class="w-full">
              {loading ? "Відправляємо..." : "Так, я погоджуюсь 🌹"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              class="w-full text-muted-foreground"
              onclick={() => (step = "decline")}
            >
              Може іншим разом...
            </Button>
          </Field.Field>

        </Field.Group>
      </form>
    </Card.Content>

  <!-- ── ФОРМА ВІДМОВИ ── -->
  {:else if step === "decline"}
    <Card.Header class="text-center">
      <div class="mb-2 text-2xl">🌷</div>
      <Card.Title>Розкажи чому</Card.Title>
      <Card.Description>Він зрозуміє — просто хоче знати</Card.Description>
    </Card.Header>

    <Card.Content>
      <form onsubmit={(e) => { e.preventDefault(); submitDecline(); }}>
        <Field.Group>

          <Field.Field>
            <Field.Label>Причина</Field.Label>
            <div class="flex flex-wrap gap-2 mt-1">
              {#each declineReasons as r}
                <Button
                  type="button"
                  variant={declineReason === r ? "default" : "outline"}
                  size="sm"
                  onclick={() => { declineReason = r; declineErrors.reason = false; }}
                >
                  {r}
                </Button>
              {/each}
            </div>
            {#if declineErrors.reason}
              <Field.Description class="text-destructive">
                Обери причину
              </Field.Description>
            {/if}
          </Field.Field>

          <Field.Field>
            <Field.Label for="decline-msg">Додаткові слова</Field.Label>
            <Textarea
              id="decline-msg"
              bind:value={declineMessage}
              placeholder="Можеш написати щось ще... або нічого ✨"
              rows={3}
            />
            <Field.Description>Необов'язково</Field.Description>
          </Field.Field>

          <Field.Field class="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={loading} class="w-full">
              {loading ? "Відправляємо..." : "Надіслати відповідь"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              class="w-full text-muted-foreground"
              onclick={() => (step = "invite")}
            >
              ← Повернутись
            </Button>
          </Field.Field>

        </Field.Group>
      </form>
    </Card.Content>

  <!-- ── УСПІХ ТАК ── -->
  {:else if step === "done-yes"}
    <Card.Header class="text-center py-10">
      <div class="text-4xl mb-3 animate-bounce">🌹</div>
      <Card.Title>Чудово!</Card.Title>
      <Card.Description class="mt-2">
        Твоя відповідь вже летить до нього.<br />
        Він обов'язково напише — чекай ✨
      </Card.Description>
    </Card.Header>

  <!-- ── УСПІХ НІ ── -->
  {:else if step === "done-no"}
    <Card.Header class="text-center py-10">
      <div class="text-4xl mb-3">🌷</div>
      <Card.Title>Зрозуміло...</Card.Title>
      <Card.Description class="mt-2">
        Він отримав твою відповідь.<br />
        Можливо, наступного разу ❤️
      </Card.Description>
    </Card.Header>
  {/if}

</Card.Root>