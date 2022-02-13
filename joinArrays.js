const startTime = performance.now();

const fs = require('fs');

// *****
// Util Functions
// *****

// function to format each event adding date as iso string
function formatEvent(event) {
    const currentDate = event.date;
    //remove the ET from time if it includes it
    let currentTime = event.time.replace('ET', '');
    event.date = new Date(currentDate + ' ' + currentTime);
    return event;
}
//  function to create an array of events from an object formated with date and sorted by date
function createEventArrayFromObject(obj, isSlate = false) {
    return Object.entries(obj).map(event => ({ event: formatEvent(event[1]), isSlate }));
}

function sortArrayByDate(array) {
    return [...array].sort((a, b) => {
        const aDate = a.event.date;
        const bDate = b.event.date;
        return aDate.getTime() - bDate.getTime();
    });
}

function getIsDuplicateEvent(currentEvent, previousEvent) {
    const currentDate = String(currentEvent.date);
    const currentTeams = currentEvent.teams;
    const previousDate = String(previousEvent.date || previousEvent[0]?.date);
    const previousTeams = previousEvent.teams || previousEvent[0]?.teams;
    const isDuplicateEvent = currentDate === previousDate && currentTeams === previousTeams;
    return isDuplicateEvent;
}

function combineEventsRemovingDuplicates(events) {
    const mergedEvents = [];
    events.forEach(event => {
        const currentEvent = event.event;
        const previousEvent = mergedEvents[mergedEvents.length - 1]?.event;
        const isSlate = event.isSlate;
        // if first event, add it to the array
        if (!previousEvent) {
            mergedEvents.push({ event: currentEvent, isSlate, isStacked: false, sp: "LOL" });
            return;
        }

        const isDuplicateEvent = getIsDuplicateEvent(currentEvent, previousEvent);

        // if event is new then add it to the array
        if (!isDuplicateEvent) {
            mergedEvents.push({ event: currentEvent, isSlate, isStacked: false, sp: "LOL" });
            return;
        }

        // if it is a duplicate event add it to event array and set isStacked to true
        if (isDuplicateEvent) {
            const oldEvent = mergedEvents.pop();
            const oldEvents = (oldEvent.isStacked) ? [...oldEvent.event] : [oldEvent.event];
            oldEvent.event = [...oldEvents, currentEvent];
            oldEvent.isSlate = oldEvent.isSlate || isSlate;
            oldEvent.isStacked = true;
            mergedEvents.push(oldEvent);
        };

    });

    return mergedEvents;
}

// *****
// end of utility functions
// *****


// get input.json file
const inputFile = fs.readFileSync('input.json', 'utf8');

// parse input.json file
const inputJson = JSON.parse(inputFile);

// create 2 arrays to join together
const sportingEventsArray = createEventArrayFromObject(inputJson.data.sporting_events);
const slateEventsArray = createEventArrayFromObject(inputJson.data.slate_events, true);

// join the 2 arrays together and sort by date
const allEvents = sortArrayByDate([...sportingEventsArray, ...slateEventsArray]);

//join the 2 arrays together and remove duplicates
const combinedSportingEvents = combineEventsRemovingDuplicates(allEvents);


//export output.json file
fs.writeFileSync('exercise.json', JSON.stringify(combinedSportingEvents, null, 4));

const endTime = performance.now();
console.log(`Execution time: ${(endTime - startTime) / 1000} seconds.`);
