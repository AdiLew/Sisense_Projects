/***
 * this is service may be added to the existing plugin
 *
 * after adding to the plugin folder add its reference to the plugin.json
 * now you may inject this service as: "plugin-{plugin name}.services.bindOnce"
 *
 * Example of usage:
 *
 * prism.run([
 *  'plugin-myPluginName.services.bindOnce',
 *   function ($bindOnce) {
 *      ...
 *      $bindOnce(widget, "domready", onDomready);
 *   }
 *]);
 *
 */

mod.service("bindOnce", [
    function () {

        //check model for existing event handler by event name
        function hasEventHandler(model, eventName, handler) {
            var eventHandlers = model.$ngscope // is prism model ?
                ? ($$get(prism, '$ngscope.$$listeners.' + eventName) || []) // for prism model
                : model.$$eventHandlers(eventName); // for dashboard or widget model

            return eventHandlers.indexOf(handler) >= 0;
        }

        //check model for existing event handler by event name, if not found the bind.
        function bindOnce(model, eventName, handler) {
            if (!hasEventHandler(model, eventName, handler)) {
                model.on(eventName, handler);
            } else {
                console.log("event handler for '" + eventName + "' has already been added");
            }
        }

        //check if arguments are valid
        function isValid(model, eventName, handler) {
            return defined(model) && typeof eventName === "string" && typeof handler === "function";
        }

        // exposing the binding function
        return function (model, eventName, handler) {
            if (isValid(model, eventName, handler)) {
                bindOnce(model, eventName, handler);
            } else {
                throw new Error("bindOnce(): specified arguments are not valid");
            }
        };
    }
]);