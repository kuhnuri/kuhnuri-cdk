export type Config = {
  region: string;
  baseImage: string;
  /** Transtypes and how they are split into tasks */
  transtypes: Record<string, string[]>;
  workers: [
    {
      /** List of transtypes the worker can process */
      transtypes: string[];
      /** List of plug-ins installed on worker DITA-OT */
      plugins: string[];
    }
  ];
};
