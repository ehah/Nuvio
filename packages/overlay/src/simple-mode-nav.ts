import type { IndexWireEntry } from "@nuvio/shared";
import type { SimpleRouterMode } from "./task-router-modes.js";
import {
  formatCardDisplayName,
  formatCardGroupName,
  formatTableDisplayName,
  isTableCellId,
} from "./human-naming.js";

export { isTableCellId } from "./human-naming.js";

export function tableCellFieldLabel(id: string): string | null {
  const match = id.match(/\.row\.[^.]+\.(\w+)$/);
  if (!match) {
    return null;
  }
  const suffix = match[1];
  const mapped: Record<string, string> = {
    nameText: "Product Name",
    name: "Product Name",
    category: "Product Category",
    price: "Product Price",
    status: "Order Status",
  };
  return mapped[suffix] ?? null;
}

export function tablePrefixFromId(id: string): string {
  return id.replace(/\.(section|table|title|header\..+|row\..+)$/, "").replace(/\.row\.[^.]+$/, "");
}

export type SimpleBackNav = {
  label: string;
  onBack: () => void;
};

export function buildSimpleBackNav(args: {
  mode: SimpleRouterMode | null;
  selectedId: string;
  indexEntries: readonly IndexWireEntry[];
  cardPrefix: string | null;
  tablePrefix: string;
  chartPrefix: string;
  formPrefix: string;
  cardTask?: string;
  tableTask?: string;
  cardTaskAtMenu: boolean;
  tableTaskAtMenu: boolean;
  buttonTaskAtMenu: boolean;
  formTaskAtMenu: boolean;
  chartTaskAtMenu: boolean;
  sectionTaskAtMenu: boolean;
  navTaskAtMenu: boolean;
  onNavigate: (id: string) => void;
  onResetTask: () => void;
}): SimpleBackNav | null {
  const {
    mode,
    selectedId,
    indexEntries,
    cardPrefix,
    tablePrefix,
    chartPrefix,
    formPrefix,
    onNavigate,
    onResetTask,
  } = args;

  if (!mode) {
    return null;
  }

  if (mode === "table") {
    if (args.tableTaskAtMenu && !isTableCellId(selectedId) && !selectedId.includes(".header.")) {
      return null;
    }
    if (args.tableTask === "tableStyle") {
      return {
        label: "← Table Options",
        onBack: () => onResetTask(),
      };
    }
    const tableName = formatTableDisplayName(tablePrefix, indexEntries);
    return {
      label: `← ${tableName}`,
      onBack: () => {
        onResetTask();
        const root =
          indexEntries.find((e) => e.id === `${tablePrefix}.section`)?.id ??
          indexEntries.find((e) => e.id === `${tablePrefix}.table`)?.id ??
          `${tablePrefix}.section`;
        onNavigate(root);
      },
    };
  }

  if (mode === "card" && cardPrefix) {
    if (args.cardTaskAtMenu && selectedId === `${cardPrefix}.card`) {
      return null;
    }
    if (args.cardTask === "cardStyle") {
      return {
        label: "← Card Options",
        onBack: () => onResetTask(),
      };
    }
    const cardName = formatCardDisplayName(cardPrefix, indexEntries);
    return {
      label: `← ${cardName}`,
      onBack: () => {
        onResetTask();
        onNavigate(`${cardPrefix}.card`);
      },
    };
  }

  if (mode === "chart") {
    if (args.chartTaskAtMenu) {
      return null;
    }
    const chartName = `${formatCardGroupName(chartPrefix, indexEntries)} Chart`;
    return {
      label: `← ${chartName}`,
      onBack: () => {
        onResetTask();
        const root =
          indexEntries.find((e) => e.id === `${chartPrefix}.card`)?.id ??
          indexEntries.find((e) => e.id === chartPrefix)?.id ??
          chartPrefix;
        onNavigate(root);
      },
    };
  }

  if (mode === "form") {
    if (args.formTaskAtMenu) {
      return null;
    }
    return {
      label: `← ${formatCardGroupName(formPrefix, indexEntries)} Field`,
      onBack: () => {
        onResetTask();
        onNavigate(formPrefix);
      },
    };
  }

  if (mode === "button") {
    if (args.buttonTaskAtMenu) {
      return null;
    }
    return {
      label: `← Button`,
      onBack: () => {
        onResetTask();
        onNavigate(selectedId);
      },
    };
  }

  if (mode === "section") {
    if (args.sectionTaskAtMenu) {
      return null;
    }
    return {
      label: `← Section`,
      onBack: () => {
        onResetTask();
        onNavigate(selectedId);
      },
    };
  }

  if (mode === "nav") {
    if (args.navTaskAtMenu) {
      return null;
    }
    return {
      label: `← Navigation`,
      onBack: () => {
        onResetTask();
        onNavigate("app.sidebar");
      },
    };
  }

  return null;
}
