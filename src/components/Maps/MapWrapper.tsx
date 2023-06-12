import "src/styles/mui-override.css";
import "azure-maps-drawing-tools";
import "src/components/Maps/Legend/LegendControl";

import React, { useState, useEffect, memo, useMemo } from "react";
import { Box, Button } from "@mui/material";
import { capitalizeFirstLetter } from "src/helpers/StringUtils";
import { LegendControl, LegendType } from "./Legend";
import { AuthenticationOptions, AuthenticationType, ControlOptions, ControlPosition, data, HtmlMarkerOptions, SymbolLayerOptions } from "azure-maps-control";
import {
  AzureMap,
  AzureMapDataSourceProvider,
  AzureMapHtmlMarker,
  AzureMapLayerProvider,
  AzureMapsProvider,
  IAzureCustomControls,
  IAzureDataSourceChildren,
  IAzureMapControls, IAzureMapHtmlMarkerEvent, IAzureMapLayerType, IAzureMapOptions
} from "react-azure-maps";

// ----=======================---- Map Options & Controls ----=======================---- //

const legends: LegendType[] = [
  {
    type: "gradient",
    subtitle: "Intensity",

    // @ts-ignore
    stops: [{
      offset: 0, color: "royalblue", label: "low"
    }, {
      offset: 0.25, color: "cyan"
    }, {
      offset: 0.5, color: "lime", label: "medium"
    }, {
      offset: 0.75, color: "yellow"
    }, {
      offset: 1, color: "red", label: "high"
    }]
  }];

//Add the custom control to the map.
const legend = new LegendControl({
  //Global title to display for the legend.
  title: "Legend",
  legends: legends

  //How the legend control should layout multiple legend cards. Options: "list" | "carousel" | "accordion"
  // layout: "accordion",

  //container: "outsidePanel",
});

const controls: IAzureMapControls[] = [{
  controlName: "CompassControl",
  controlOptions: { rotationDegreesDelta: 10 },
  options: { position: ControlPosition.TopLeft } as ControlOptions
}, {
  controlName: "ZoomControl", options: { position: ControlPosition.TopLeft } as ControlOptions
}];

const consistentZoomOptions = {
  radius: [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    //For all zoom levels 10 or lower, set the radius to 2 pixels.
    10, 2,

    //Between zoom level 10 and 22, exponentially scale the radius from 2 pixels to 50000 pixels.
    22, 50000
  ],
  intensity: 0.5,
  opacity: 0.5
};

// ----=======================---- React Component ----=======================---- //

function MapWrapper() {

  //const [controller] = useMaterialUIController();
  //const { darkMode } = controller;
  const darkMode = false;
  // ----=======================---- Map Options ----=======================---- //

  const authTokenOptions : AuthenticationOptions = {
    authType: AuthenticationType.subscriptionKey, subscriptionKey: process.env.REACT_APP_MAP_API_KEY
  }

  const mapOptions : IAzureMapOptions = {
    // @ts-ignore
    authOptions: authTokenOptions, 
    style: "satellite", 
    showFeedbackLink: false, 
    language: "en-US", 
    view: "Auto",

    // This is Prague specific:
    center: [14.4378, 50.0755], 
    zoom: 14, 
    maxZoom: 20,
    minZoom: 12,
    maxBounds: [14.2, 50.0, 14.6, 50.15]
  }

  // @ts-ignore
  const customControls: [IAzureCustomControls] = [
    {
      // @ts-ignore
      control: legend,
      controlOptions: {
        position: ControlPosition.BottomLeft
      }
    }
  ];

  const memoizedOptions: SymbolLayerOptions = {
    textOptions: {
      textField: ["get", "title"], //Specify the property name that contains the text you want to appear with the symbol.
      offset: [0, 1.2],
    },
  };

  // ----=======================---- States, Hooks ----=======================---- //

  const [displayedOverlayUrl, setDisplayedOverlayUrl] = useState("");
  const [currentMapOptions, setMapOptions] = useState(mapOptions);
  const [currentCustomControls, setCustomControls] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [htmlMarkers, setHtmlMarkers] = useState([new data.Position(14.4378, 50.0755)]);
  const [markersLayer] = useState<IAzureMapLayerType>("SymbolLayer");
  const [layerOptions, setLayerOptions] = useState<SymbolLayerOptions>(memoizedOptions);

  useEffect(() => {
    console.log("Light/dark mode switched.")
    setMapOptions({ ...currentMapOptions,  style: darkMode ? "grayscale_dark" : "grayscale_light"});
  }, [darkMode]);

  useEffect(() => {
    console.log("Moved map center to: " + currentMapOptions.center);
    setForceUpdate(forceUpdate + 1);
  }, [currentMapOptions]);

  useEffect(() => {
    console.log("The legend has been added");
    setForceUpdate(forceUpdate + 1);
  }, [currentCustomControls]);


  // ----=======================---- Map Markers ----========================---- //

  
  function azureHtmlMapMarkerOptions(coordinates: data.Position): HtmlMarkerOptions {
    return {
      position: coordinates,
      text: "My text",
      title: "Title",
    };
  }

  const addHiddenLocation = () => {
    const randomLongitude = Math.random() * (14.6 - 14.2) + 14.2;
    const randomLatitude = Math.random() * (50.15 - 50.0) + 50.0;
    const newPoint = new data.Position(randomLongitude, randomLatitude);
    setHtmlMarkers([...htmlMarkers, newPoint]);
    console.log(htmlMarkers);
  };

  const onClick = (e: any) => {
    console.log("You click on: ", e);
  };

  const eventToMarker: Array<IAzureMapHtmlMarkerEvent> = [{ eventName: "click", callback: onClick }];

  function renderHTMLPoint(coordinates: data.Position): any {
    const rendId = Math.random();
    return (
      <AzureMapHtmlMarker
        key={rendId}
        markerContent={<div className="pulseIcon"></div>}
        options={{ ...azureHtmlMapMarkerOptions(coordinates) } as any}
        events={eventToMarker}
      />
    );
  }

  const memoizedHtmlMarkerRender: IAzureDataSourceChildren = useMemo(
    (): any => htmlMarkers.map((marker) => renderHTMLPoint(marker)),
    [htmlMarkers],
  );

  function clusterClicked(e: any) {
    console.log("clusterClicked", e);
  }


  // ----=======================---- DOM Elements ----=======================---- //

  return (
    <>
      <Button size="small" variant="contained" color="primary" onClick={addHiddenLocation}>
        {" "}
        HTML MARKER
      </Button>

      <Box
        borderRadius="lg"
        style={{ overflow: "hidden" }}>

        <AzureMapsProvider>
          <div style={{ height: 'calc(100vh - 160px)' }}>
            <AzureMap options={currentMapOptions} controls={controls} customControls={currentCustomControls}>
              <AzureMapDataSourceProvider
                events={{
                  dataadded: (e: any) => {
                    console.log("Data on FogDataProvider added", e);
                  },
                }}
                id={"FogDataProvider"}
                options={{ cluster: true, clusterRadius: 2 }}
              >
                <AzureMapLayerProvider
                  id={'FogLayer'}
                  options={{
                    // URL to an image to overlay. Images hosted on other domains must have CORs enabled.
                    url: "/static/images/locato/fog.jpg",
                    // * An array of positions for the corners of the image listed in clockwise order: [top left, top right, bottom right, bottom left].
                    coordinates: [
                      [14.2, 50.15],
                      [14.6, 50.15],
                      [14.6, 50.0],
                      [14.2, 50.0],
                    ],
                    opacity: 0.95,
                  }}
                  type={'ImageLayer'}
                />
              </AzureMapDataSourceProvider>
              <AzureMapDataSourceProvider
                events={{
                  dataadded: (e: any) => {
                    console.log("Data on HiddenLocationDataProvider added", e);
                  },
                }}
                id={"HiddenLocationDataProvider"}
                options={{ cluster: true, clusterRadius: 2 }}
              >
                <AzureMapLayerProvider
                  id={"HiddenLocationLayerProvider"}
                  options={layerOptions}
                  events={{
                    click: clusterClicked,
                    dbclick: clusterClicked,
                  }}
                  lifecycleEvents={{
                    layeradded: () => {
                      console.log("HiddenLocationLayer added to map");
                    },
                  }}
                  type={markersLayer}
                />
                {memoizedHtmlMarkerRender}
              </AzureMapDataSourceProvider>
            </AzureMap>
          </div>
        </AzureMapsProvider>
      </Box>
    </>
  );
}

export default MapWrapper;