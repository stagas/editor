import { $, alias, fn, fx, init } from 'signal'
import { Point } from 'std'

export interface AnimScrollStrategy {
  tension: number
  distance: number
  amount: number
  min: number
}

export const AnimScrollStrategy: Record<string, AnimScrollStrategy> = {
  "Fast": {
    "tension": 1,
    "distance": 100,
    "amount": 0.5,
    "min": 0.5
  },
  "Medium": {
    "tension": 2.93,
    "distance": 500,
    "amount": 0.6,
    "min": 0.25
  },
  "Slow": {
    "tension": 0.015,
    "distance": 1000,
    "amount": 0.29,
    "min": 0.01
  }
}

export class Scroll {
  pos = $(new Point)
  scroll = alias(this, 'pos')
  minScroll = $(new Point)
  scrollSize = $(new Point)
  targetScroll = $(new Point)
  animScrollStrategy: AnimScrollStrategy = AnimScrollStrategy.Fast

}
