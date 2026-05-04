export const queryKeys = {
  routes: {
    all: ['routes'] as const,
    detail: (id: number) => ['routes', id] as const,
  },
};
