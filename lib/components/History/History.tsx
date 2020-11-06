import { useContext, useEffect } from "react";
import ReactGA from "react-ga";
import { withRouter } from "react-router-dom";
import { InjectionsContext } from "../../contexts/InjectionsContext/InjectionsContext";

ReactGA.initialize("UA-150306816-1");

declare const window: Window & { ga: Function };

export const History = withRouter(function HistoryComponent(props) {
  const { googleAnalyticsService } = useContext(InjectionsContext);
  const {
    location: { pathname },
  } = props;

  useEffect(() => {
    googleAnalyticsService.sendPageView();
  }, [pathname]);
  return null;
});
