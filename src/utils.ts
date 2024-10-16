export const create_canvas = (w: number, h: number) => {
  let layers: HTMLCanvasElement[] = []

  const main = document.createElement('canvas')
  main.width = w
  main.height = h

  const scene = main.getContext('2d')!

  const blank = scene.getImageData(0, 0, w, h)

  const compose = () => {
    scene.clearRect(0, 0, w, h)
    layers.forEach((layer) => scene.drawImage(layer, 0, 0))
  }

  return {
    main,
    scene,

    stack: (order: CanvasRenderingContext2D[]) => {
      layers = order.map((ctx) => ctx.canvas)
    },

    compose,
    draw: (
      ctx: CanvasRenderingContext2D,
      cb: (ctx: CanvasRenderingContext2D) => void
    ) => {
      ctx.reset()
      ctx.clearRect(0, 0, w, h)
      ctx.putImageData(blank, w, h)
      cb(ctx)
      compose()
    },

    layer: () => {
      const layer = document.createElement('canvas')
      layer.width = w
      layer.height = h
      const ctx = layer.getContext('2d')!
      return ctx
    },
  }
}
