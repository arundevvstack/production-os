export class ProgressEngine {
  /**
   * Calculates completion percentage for a checklist
   */
  static calculateChecklistProgress(items: { is_completed: boolean }[]): number {
    if (!items || items.length === 0) return 0;
    const completed = items.filter(i => i.is_completed).length;
    return Math.round((completed / items.length) * 100);
  }

  /**
   * Evaluates if a stage can be marked complete based on required checklists
   */
  static canCompleteStage(items: { is_completed: boolean; is_required: boolean }[]): boolean {
    if (!items) return true;
    const requiredItems = items.filter(i => i.is_required);
    return requiredItems.every(i => i.is_completed);
  }

  /**
   * Aggregates project overall progress from its constituent stages
   */
  static calculateProjectProgress(stages: { completion_pct: number }[]): number {
    if (!stages || stages.length === 0) return 0;
    const total = stages.reduce((acc, stage) => acc + stage.completion_pct, 0);
    return Math.round(total / stages.length);
  }
}
