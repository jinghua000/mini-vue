const resolvedPromise = Promise.resolve()
const queue = []
let flushIndex = 0
let currentFlushPromise = null

export function nextTick(fn?) {
    let p = currentFlushPromise || resolvedPromise
    return fn ? p.then(fn) : p
}

export function queueJob(job) {
    if (!queue.length || !queue.includes(job)) {
        queue.push(job)
        queueFlush()
    }
}

function queueFlush() {
    currentFlushPromise = resolvedPromise.then(flushJobs)
}

function flushJobs() {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
        queue[flushIndex]()
    }

    queue.length = 0
    currentFlushPromise = null
}