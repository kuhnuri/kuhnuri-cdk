export type Config = {
  region: string;
  baseImage: string;
  workers: [
    {
      transtypes: string[];
      plugins: string[];
    }
  ];
};
