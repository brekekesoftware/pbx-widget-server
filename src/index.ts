import { GlobalEventNames } from '@core/types/events';
import { Call } from '@core/types/phone';

type Events = GlobalEventNames | 'widgetReady';

const log = (...args: any[]) => {
  if (!location.host.startsWith('localhost') && !location.host.startsWith('127.0.0.1')) return;
  console.log('widget-server', ...args);
};

(function () {
  window.Brekeke.renderWidget(
    document.getElementById('widget_embed_div')!,
    ({
       fireCallInfoEvent,
       fireConfigEvent,
       fireLogSavedEvent,
       fireMakeCallEvent,
       onCallUpdatedEvent,
       onCallEndedEvent,
       onLoggedOutEvent,
       onLoggedInEvent,
       onCallEvent,
       onLogEvent,
     }) => {
      const app = window.parent;

      const messageName = (name: Events) => `brekeke:${name}`;

      const sendMessage = <T>(name: Events, data?: T) => {
        try {
          app.postMessage(JSON.stringify({ name: messageName(name), data }), '*');
        } catch (e) {
          log('send message error', name, e);
        }
      };

      window.addEventListener('message', event => {
        try {
          const { name, data } = JSON.parse(event.data);
          if (!name || (typeof name == 'string' && !name.startsWith('brekeke:'))) return;

          log(`${name} message received`, event);
          log(`${name} message data`, data);

          switch (name) {
            case messageName('make-call'):
              fireMakeCallEvent(data);
              break;
            case messageName('call-info'):
              const call = data.call as Call;
              fireCallInfoEvent(call, data.info);
              break;
            case messageName('config'):
              fireConfigEvent(data);
              break;
            case messageName('log-saved'):
              fireLogSavedEvent(data);
              break;
          }
        } catch (e) {
          log('message error, invalid json string', e);
        }
      });

      sendMessage('widgetReady');

      onLoggedInEvent(account => sendMessage('logged-in', account));

      onLoggedOutEvent(() => sendMessage('logged-out'));

      onCallEvent(call => sendMessage('call', simplifyCall(call)));

      onCallUpdatedEvent(call => sendMessage('call-updated', simplifyCall(call)));

      onCallEndedEvent(call => sendMessage('call-ended', simplifyCall(call)));

      onLogEvent(log => sendMessage('log', { ...log, call: simplifyCall(log.call) }));
    });
})();

const validTypes = ['string', 'number', 'boolean'];
const simplifyCall = (call: Call) => {
  return Object.keys(call).reduce((acc, key) => {
    const property: unknown = call[key as keyof Call];

    if (validTypes.includes(typeof property)) {
      // @ts-ignore
      acc[key] = property;
    }

    return acc;
  }, {} as Call);
}
