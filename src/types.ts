export type DataAttribute = (
  | { id: string; type: "root"; debug: boolean; label: string, isScrollytelling?: boolean }
  | { id?: string; type: "animation" | "rest"; label?: string }
  | { id?: string; type: "instant-animation"; label?: string }
  | {
    id?: string;
    type: "waypoint";
    label: string;
    _internalOnCall?: () => void;
    _internalOnReverseCall?: () => void;
  }
);

export type GSAPChildWithHiddenVars = (gsap.core.Timeline | gsap.core.Tween) & {
  _start: number;
  _end: number;
  _dur: number;
}

export type VisualizerItem = Omit<gsap.core.Tween | gsap.core.Timeline, "data"> & {
  _start: number;
  _ease: gsap.EaseFunction;
  _dur: number;
  data: {
    _visualizer: DataAttribute;
  };
};

export type VisualizerRoot = {
  id: string;
  debug: boolean;
  label: string;
  tween?: gsap.core.Timeline | gsap.core.Tween;
  children: VisualizerItem[];
};
