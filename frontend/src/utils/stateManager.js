export const STATES = {
    ENTRY: "ENTRADA",
    BREAK: "BREAK",
    LUNCH: "ALMUERZO",
    BATHROOM: "BAÑO",
    EXIT: "SALIDA"
};

export function canChangeState(currentState, newState) {

    if (!currentState) return true;

    if (currentState === STATES.EXIT)
        return false;

    return currentState !== newState;
}

export function getButtonColor(state){

    switch(state){

        case STATES.ENTRY:
            return "#1565C0";

        case STATES.BREAK:
            return "#F9A825";

        case STATES.LUNCH:
            return "#43A047";

        case STATES.BATHROOM:
            return "#8E24AA";

        case STATES.EXIT:
            return "#D32F2F";

        default:
            return "#607D8B";
    }

}