import { assign, createMachine, interpret } from 'xstate'
import '../xstate/inspector'

type FlightContext = {
	startDate?: string
	returnDate?: string
	trip: 'oneWay' | 'roundTrip'
}

type Trip = 'oneWay' | 'roundTrip'

type FlightEvent =
	| {
			type: 'SET_TRIP'
			value: Trip
	  }
	| {
			type: 'startDate.UPDATE'
			value: string
	  }
	| {
			type: 'returnDate.UPDATE'
			value: string
	  }
	| { type: 'SUBMIT' }

const flightMachine = createMachine<FlightContext, FlightEvent>(
	{
		initial: 'editing',
		context: {
			startDate: null,
			returnDate: null,
			trip: 'oneWay',
		},
		states: {
			editing: {
				on: {
					'startDate.UPDATE': {
						actions: 'setStartDate',
					},
					'returnDate.UPDATE': {
						actions: 'setReturnDate',
						cond: 'isRoundTrip',
					},
					SET_TRIP: {
						actions: 'setTrip',
						cond: 'isValidType',
					},
					SUBMIT: {
						target: 'submitted',
						cond: 'isValidInput',
					},
				},
			},
			submitted: { type: 'final' },
		},
	},
	{
		actions: {
			setStartDate: assign({ startDate: (_, event) => event.value }),
			setReturnDate: assign({ returnDate: (_, event) => event.value }),
			setTrip: assign({ trip: (_, event) => event.value }),
		},
		guards: {
			isRoundTrip: (ctx) => ctx.trip === 'roundTrip',
			isValidType: (_, event) =>
				event.value === 'oneWay' || event.value === 'roundTrip',
			isValidInput: (ctx) => {
				if (ctx.trip === 'oneWay') {
					return !!ctx.startDate
				} else {
					return (
						!!ctx.startDate &&
						!!ctx.returnDate &&
						ctx.returnDate > ctx.startDate
					)
				}
			},
		},
	}
)

const flightBooker = interpret(flightMachine, {
	devTools: true,
}).start()

const html = `
  <form class="flex flex-col gap-2 text-black">
    <select class="options p-2 rounded">
      <option value="oneWay">One way</option>
      <option value="roundTrip">Round trip</option>
    </select>

    <label>
      <input
        class="start-date p-2 text-black rounded"
        placeholder="Start date"
        type="date"
      />
    </label>

    <label>
      <input
        class="return-date p-2 text-black rounded"
        placeholder="Return date"
        type="date"
      />
    </label>

    <button
      class="button bg-gray-50 p-2 rounded"
      type="button"
    >
      Submit
    </button>
  </form>
`

document.body.insertAdjacentHTML('afterbegin', html)

const selectEl = document.querySelector<HTMLSelectElement>('.options')!
const startDateEl = document.querySelector<HTMLInputElement>('.start-date')!
const returnDateEl = document.querySelector<HTMLInputElement>('.return-date')!
const submitBtnEl = document.querySelector<HTMLButtonElement>('.button')!

const startDateLabelEl = startDateEl.parentElement
const returnDateLabelEl = returnDateEl.parentElement

flightBooker.subscribe((state) => {
	const { startDate, returnDate, trip } = state.context

	const canSubmit = flightMachine.transition(state, 'SUBMIT').changed

	const startDateError = !startDate
	const returnDateError = !returnDate || returnDate <= startDate

	startDateLabelEl.dataset.state = startDateError ? 'error' : 'idle'
	returnDateLabelEl.dataset.state = returnDateError ? 'error' : 'idle'
	submitBtnEl.dataset.state = state.toStrings().join(' ')

	returnDateEl.disabled = trip === 'oneWay'
	submitBtnEl.disabled = !canSubmit

	if (state.matches('editing')) submitBtnEl.innerText = 'Submit'
	if (state.matches('submitted')) submitBtnEl.innerText = 'Success!'
})

selectEl.onchange = (event) => {
	const value = (event.target as HTMLSelectElement).value as Trip
	flightBooker.send({ type: 'SET_TRIP', value })
}

startDateEl.oninput = (event) => {
	const value = (event.target as HTMLInputElement).value
	flightBooker.send({ type: 'startDate.UPDATE', value })
}

returnDateEl.oninput = (event) => {
	const value = (event.target as HTMLInputElement).value
	flightBooker.send({ type: 'returnDate.UPDATE', value })
}

submitBtnEl.onclick = () => flightBooker.send({ type: 'SUBMIT' })

// you also have to add onBlur to the inputs to only
// show errors if the user interacted with the inputs
// error && touched ? "error" : "idle" but I'm lazy
