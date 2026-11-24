export type AIRequestFeature = 'symptoms' | 'brief' | 'insights';

/** Keeps asynchronous AI responses scoped to both feature and consultation. */
export class AIRequestGuard {
  private consultationId: string | null = null;
  private readonly generations: Record<AIRequestFeature, number> = { symptoms: 0, brief: 0, insights: 0 };

  switchConsultation(consultationId: string): void {
    if (this.consultationId === consultationId) return;
    this.consultationId = consultationId;
    for (const feature of Object.keys(this.generations) as AIRequestFeature[]) this.generations[feature] += 1;
  }

  begin(feature: AIRequestFeature, consultationId: string): number {
    this.switchConsultation(consultationId);
    this.generations[feature] += 1;
    return this.generations[feature];
  }

  isCurrent(feature: AIRequestFeature, consultationId: string, generation: number): boolean {
    return this.consultationId === consultationId && this.generations[feature] === generation;
  }

  cancelAll(): void {
    for (const feature of Object.keys(this.generations) as AIRequestFeature[]) this.generations[feature] += 1;
  }
}
