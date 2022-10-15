import { assign, createMachine, interpret } from 'xstate'
import '../xstate/inspector'

type CounterContext = { count: number }

type CounterEvent = {
	type: 'INCREMENT' | 'DECREMENT'
}

const counterMachine = createMachine<CounterContext, CounterEvent>(
	{
		initial: 'active',
		context: { count: 0 },
		states: {
			active: {
				on: {
					INCREMENT: { actions: 'increment', cond: 'isNotMax' },
					DECREMENT: { actions: 'decrement', cond: 'isNotMin' },
				},
			},
		},
	},
	{
		actions: {
			increment: assign({ count: (ctx) => ctx.count + 1 }),
			decrement: assign({ count: (ctx) => ctx.count - 1 }),
		},
		guards: {
			isNotMax: (ctx) => ctx.count < 10,
			isNotMin: (ctx) => ctx.count > 0,
		},
	}
)

const counter = interpret(counterMachine, { devTools: true }).start()

const btn = 'bg-neutral-800 p-2 px-4 rounded-xl'

const html = `
		<div class="flex gap-2">
			<button class="inc ${btn}">+</button>
			<span class="count ${btn}">0</span/>
			<button class="dec ${btn}">-</button>
		</div>
	`

document.body.insertAdjacentHTML('afterbegin', html)

const incEl = document.querySelector<HTMLDivElement>('.inc')
const decEl = document.querySelector<HTMLDivElement>('.dec')
const countEl = document.querySelector<HTMLSpanElement>('.count')

incEl.onclick = () => counter.send({ type: 'INCREMENT' })
decEl.onclick = () => counter.send({ type: 'DECREMENT' })

counter.subscribe((state) => {
	countEl.innerText = String(state.context.count)
})
