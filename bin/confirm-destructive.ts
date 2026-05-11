import { text, confirm, isCancel, cancel, intro, outro } from "@clack/prompts";

const phrase = process.argv[2];

if (!phrase) {
  console.error("Usage: confirm-destructive <confirmation-phrase>");
  console.error('Example: confirm-destructive "reset graph"');
  process.exit(1);
}

async function gate(): Promise<void> {
  intro("Destructive operation");

  const typed = await text({
    message: `Type "${phrase}" to continue:`,
    placeholder: phrase,
    validate: (value) => {
      if (!value || value !== phrase) return `Must type exactly: ${phrase}`;
    },
  });

  if (isCancel(typed)) {
    cancel("Aborted.");
    process.exit(1);
  }

  const confirmed = await confirm({
    message: "Are you sure? This cannot be undone.",
    initialValue: false,
  });

  if (isCancel(confirmed) || !confirmed) {
    cancel("Aborted.");
    process.exit(1);
  }

  outro("Proceeding.");
}

gate().catch(() => {
  process.exit(1);
});
