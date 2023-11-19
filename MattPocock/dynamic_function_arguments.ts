export type Event =
  | { type: "LOG_IN"; payload: { userId: string } }
  | { type: "SIGN_OUT" };

const sendEvent = (event: Event["type"], payload?: any) => {};

/* 
  Correct
*/
sendEvent("SIGN_OUT");
sendEvent("LOG_IN", { userId: "123" });

/* 
  Should error:
*/
sendEvent("SIGN_OUT", {}); // We don't want to allow payload to be passed in for SIGN_OUT
sendEvent("LOG_IN", {
  // We want to required usedId to be of type string, not number
  userId: 123,
});
sendEvent("LOG_IN", {}); // We want to require userId to be passed in
sendEvent("LOG_IN"); // We want to require userId to be passed in

/* 
  We want to set up the args of sendEvent to be able to
  require the payload or not based on the event type.
  So for LOG_IN type, payload is required, but for SIGN_OUT.
*/
const sendEventEnhanced = <T extends Event["type"]>(
  ...args: Extract<Event, { type: T }> extends { payload: infer P }
    ? [T, P]
    : [T]
) => {};

sendEventEnhanced("LOG_IN", { userId: "123" }); // Correct
sendEventEnhanced("SIGN_OUT"); // Correct
sendEventEnhanced("LOG_IN", {}); // Error. Should require userId to be passed in.
sendEventEnhanced("SIGN_OUT", {}); // Error. Sign out should not have payload.
sendEventEnhanced("LOG_IN"); // Error. Log in should have payload.
sendEventEnhanced("SIGN_OUT", { userId: "123" }); // Error. Sign out should not have payload.
