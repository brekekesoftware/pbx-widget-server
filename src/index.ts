import { GlobalEventNames, GlobalEventDetails } from '@core/types/events';
import { Call } from '@core/types/phone';

const logName = 'brekeke-widget:server';
const logger = (...args: unknown[]) => {
  if (!location.host.startsWith('localhost') && !location.host.startsWith('127.0.0.1')) return;
  if (typeof args[0] === 'string' && args[0].includes('error')) {
    console.error(logName, ...args);
    return;
  }
  console.log(logName, ...args);
};

(function () {
  window.Brekeke.renderWidget(
    document.getElementById('widget_embed_div')!,
    ({
       fireCallInfoEvent,
       fireConfigEvent,
       fireLogSavedEvent,
       fireMakeCallEvent,
       fireNotification,
       onCallRecordedEvent,
       onCallUpdatedEvent,
       onCallEndedEvent,
       onLoggedOutEvent,
       onLoggedInEvent,
       onCallEvent,
       onLogEvent,
       onContactSelectedEvent,
       onDuplicateContactCallAnsweredEvent,
     }) => {
      const app = window.parent;

      const messageName = (name: GlobalEventNames | 'widgetReady') => `brekeke:${name}`;

      const sendMessage = <T extends GlobalEventNames>(name: T | 'widgetReady', data?: GlobalEventDetails<T>) => {
        try {
          app.postMessage(JSON.stringify({ name: messageName(name), data }), '*');
        } catch (e) {
          logger('send message error', name, e);
        }
      };

      window.addEventListener('message', event => {
        try {
          const { name, data } = JSON.parse(event.data);
          if (!name || (typeof name == 'string' && !name.startsWith('brekeke:'))) return;

          logger(`${name} message received`, event);
          logger(`${name} message data`, data);

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
            case messageName('notification'):
              fireNotification(data);
              break;
          }
        } catch (e) {
          logger('message error, invalid json string', e);
        }
      });

      sendMessage('widgetReady');

      onLoggedInEvent(account => sendMessage('logged-in', account));

      onLoggedOutEvent(() => sendMessage('logged-out'));

      onCallEvent(call => sendMessage('call', simplifyCall(call)));

      onCallUpdatedEvent(call => sendMessage('call-updated', simplifyCall(call)));

      onCallEndedEvent(call => sendMessage('call-ended', simplifyCall(call)));

      onContactSelectedEvent(e => sendMessage('contact-selected', { ...e, call: simplifyCall(e.call) }));

      onCallRecordedEvent(record => sendMessage('call-recorded', record));

      onDuplicateContactCallAnsweredEvent(e => sendMessage('duplicate-contact-call-answered', { ...e, call: simplifyCall(e.call) }));

      onLogEvent(log => sendMessage('log', { ...log, call: simplifyCall(log.call) }));
    });
})();

// types that can be passed to postMessage
const validTypes = ['string', 'number', 'boolean'];
const simplifyCall = (call: Call) => {
  return Object.entries(call).reduce((acc, [k, v]) => {
    // @ts-ignore
    if (validTypes.includes(typeof v)) acc[k] = v;
    return acc;
  }, {} as Call);
}
