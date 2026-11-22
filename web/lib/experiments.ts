// Experimental features (Specification 4.7, Architecture decision 39): features that are built and deployed but
// hidden until switched on, on each device, from Settings → Experimental features.
//
// To add one: give it an entry here, then check it where it appears with useExperiment("its-id")
// (components/experiments.tsx). When it's ready for everyone, or dropped, remove its entry and the check
// in the same release. Saved switches for features no longer listed are ignored.

export type Experiment = {
  id: string; // stays the same for as long as the feature is listed; it's the key its switch is saved under
  name: string;
  description: string; // one line
};

export const EXPERIMENTS: Experiment[] = [
  // Architecture decision 40: Parse matches merchant names to those already used this month or last month
  {
    id: "known-merchants",
    name: "Intelligent Merchant Selection",
    description: "Infer merchant names from this month's and last month's expenses.",
  },
];
