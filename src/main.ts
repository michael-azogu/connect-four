import './style.css'
import { create_canvas } from './utils'

const ROWS = 6
const COLS = 7
const SIDE = 100

const width = COLS * SIDE
const height = ROWS * SIDE

const radius = (3 / 5) * (SIDE / 2)

const { main, layer, draw, stack } = create_canvas(width, height)

const disks = layer()
const falling = layer()
const rack = layer()
const marked = layer()
const hover = layer()

stack([disks, falling, rack, marked, hover])

const relative = ({ clientX, clientY }: MouseEvent) => {
  const { top, left } = main.getBoundingClientRect()
  const [cy, cx] = [clientY - top, clientX - left]
  return {
    y: cy < height ? cy : height - 1,
    x: cx < width ? cx : width - 1,
  }
}

enum player {
  one,
  two,
}

let current = player.one

const turn = (() => {
  let i = 0
  let players = [player.one, player.two]
  return () => (current = players[(i = (i + 1) % 2)])
})()

let disk_color = {
  [player.one]: '#f44',
  [player.two]: '#44f',
}

const columns = Array.from<number, player[]>({ length: COLS }, () => [])

columns[0].push(player.two, player.two, player.one)

draw(rack, (ctx) => {
  ctx.fillStyle = '#fd3'
  ctx.roundRect(2, 2, width - 4, height - 4, radius * 1.5)
  ctx.fill()
  ctx.lineWidth = 2
  ctx.stroke()
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      ctx.beginPath()
      ctx.globalCompositeOperation = 'destination-out'
      const cx = c * SIDE + SIDE / 2
      const cy = (ROWS - r - 1) * SIDE + SIDE / 2
      ctx.arc(cx, cy, radius * 1.1, 0, 2 * Math.PI)
      ctx.fill()
      ctx.closePath()

      ctx.beginPath()
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = 5
      ctx.strokeStyle = '#000'
      ctx.arc(cx, cy, radius * 1.15, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.closePath()

      ctx.beginPath()
      ctx.strokeStyle = '#aaa'
      ctx.lineWidth = 0.5
      ctx.rect(c * SIDE, r * SIDE, SIDE, SIDE)
      ctx.stroke()
      ctx.closePath()
    }
  }
})

const circle_center = (r: number, c: number) => ({
  cx: c * SIDE + SIDE / 2,
  cy: (ROWS - r - 1) * SIDE + SIDE / 2,
})

const draw_disks = () => {
  draw(disks, (ctx) => {
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const color = disk_color[columns[c][r]]
        if (color) {
          ctx.beginPath()
          ctx.fillStyle = color
          const { cx, cy } = circle_center(r, c)
          ctx.arc(cx, cy, radius * 1.3, 0, 2 * Math.PI)
          ctx.fill()
          ctx.closePath()
        }
      }
    }
  })
}

let animating = false

main.addEventListener('click', (e) => {
  if (animating) return

  const column = Math.floor(relative(e).x / SIDE)
  const row = columns[column].length

  if (row >= ROWS) return

  let vy = 0.25
  const g = 0.45
  const bounce = 0.77

  let y = -radius
  let { cx, cy } = circle_center(row, column)

  const base = cy + radius

  const color = disk_color[current]

  animating = true

  const animation = () => {
    y += vy += g

    if (y + radius > base) {
      y = base - radius
      vy = -vy * bounce
    }

    draw(falling, (ctx) => {
      ctx.beginPath()
      ctx.arc(cx, y, radius * 1.3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.stroke()
    })

    if (Math.abs(vy) < 1 && y + 5 > base - radius) {
      draw(marked, (ctx) => {
        const { cx, cy } = circle_center(row, column)
        ctx.fillStyle = '#fff'
        ctx.arc(cx, cy, 5, 0, 2 * Math.PI)
        ctx.fill()
      })
      draw_disks()
      draw_hover(column)
      return (animating = false)
    }
    requestAnimationFrame(animation)
  }
  requestAnimationFrame(animation)

  columns[column].push(current)

  turn()
})

const draw_hover = (column: number) => {
  draw(hover, (ctx) => {
    ctx.beginPath()
    ctx.fillStyle = '#5585'
    ctx.rect(column * SIDE, 0, SIDE, height)
    ctx.fill()
    ctx.closePath()

    ctx.beginPath()
    const { cx, cy } = circle_center(columns[column].length, column)
    ctx.fillStyle = disk_color[current] + '8'
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  })
}

main.addEventListener('mousemove', (e) => {
  const column = Math.floor(relative(e).x / SIDE)
  draw_hover(column)
})
main.addEventListener('mouseleave', () => draw(hover, () => {}))

draw_disks()

document.body.append(main)
document.body.append(falling.canvas)
// document.body.append(rack.canvas)
document.body.append(disks.canvas)
document.body.append(hover.canvas)
document.body.append(marked.canvas)
