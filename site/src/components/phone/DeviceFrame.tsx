import StatusBar from "./StatusBar";
import TabBar, { type TabItem } from "./TabBar";

/**
 * The device for every route that shows one. It replaced PhoneFrame on /demo
 * first and on / on 2026-08-09, at which point PhoneFrame was deleted.
 *
 * min-height, never height. At a fixed height the caregiver's four watch-fors
 * plus the routing panel printed outside the device.
 */
export default function DeviceFrame({
  role, caption, clock, tabs, children,
}: {
  role: "elder" | "carer";
  caption: string;
  clock: string;
  tabs: TabItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="cc-col">
      <div className="cc-label cc-cap">{caption}</div>
      <div className={`cc-dev cc-dev--${role}`}>
        <div className={`cc-app cc-app--${role}`}>
          <div className="cc-dev-island" aria-hidden="true" />
          <StatusBar clock={clock} />
          <div className="cc-app-body">{children}</div>
          <TabBar items={tabs} />
          <div className="cc-dev-home" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
