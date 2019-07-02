export type Config = {
  region: string;
  baseImage: string;
  workers: [
    {
      plugins: string[];
    }
  ];
};
