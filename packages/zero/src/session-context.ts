export interface TracerSessionContext {
  readonly session_id: string;
  readonly user_id: string;
}

export type OptionalTracerSessionContext = TracerSessionContext | null;
