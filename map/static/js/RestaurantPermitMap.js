import React, { useEffect, useState } from "react"

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"

import "leaflet/dist/leaflet.css"

import RAW_COMMUNITY_AREAS from "../../../data/raw/community-areas.geojson"

function YearSelect({ setFilterVal }) {
  // Filter by the permit issue year for each restaurant
  const startYear = 2026
  const years = [...Array(11).keys()].map((increment) => {
    return startYear - increment
  })
  const options = years.map((year) => {
    return (
      <option value={ year } key={ year }>
        { year }
      </option>
    )
  })

  return (
    <>
      <label htmlFor="yearSelect" className="fs-3">
        Filter by year:{ " " }
      </label>
      <select
        id="yearSelect"
        className="form-select form-select-lg mb-3"
        onChange={ (e) => setFilterVal(e.target.value) }
      >
        { options }
      </select>
    </>
  )
}

export default function RestaurantPermitMap() {
  const communityAreaColors = ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"]

  const [currentYearData, setCurrentYearData] = useState([])
  const [year, setYear] = useState(2026)
  const [totalPermits, setTotalPermits] = useState(0);
  const [maxNumPermits, setMaxNumPermits] = useState(0);

  const yearlyDataEndpoint = `/map-data/?year=${ year }`;

  useEffect(() => {
    fetch(yearlyDataEndpoint).then((res) => res.json()).then((data) => {
      setCurrentYearData(data);
      let max = 0; let total = 0;
      data.forEach((obj) => {
        total += +obj["num_permits"];
        max = Math.max(max, +obj["num_permits"]);
      });
      setTotalPermits(total);
      setMaxNumPermits(max);
    });
  }, [yearlyDataEndpoint])


  function getColor(id) {
    return communityAreaColors[id % 4];
  }

  function setAreaInteraction(feature, layer) {
    const communityObject = currentYearData.find((obj) => obj.name === feature.properties.community)
    const percentage = +communityObject["num_permits"] / maxNumPermits;
    const color = getColor(communityObject["area_id"]);
    console.log({percentage})
    layer.setStyle({
      fillOpacity: percentage,
      fillColor: color,
      opacity: percentage + 0.2
    })
    layer.on("mouseover", () => {
      layer.bindPopup(`
      <p>${ communityObject["name"] }</p>
      <p>Number of permits: ${ communityObject["num_permits"] }</p>
      `)
      layer.openPopup()
    })
  }

  return (
    <>
      <YearSelect filterVal={ year } setFilterVal={ setYear }/>
      <p className="fs-4">
        { totalPermits } Restaurant permits issued in { year }
      </p>
      <p className="fs-4">
        Maximum number of restaurant permits in a single area: { maxNumPermits }
      </p>
      <MapContainer
        id="restaurant-map"
        center={ [41.88, -87.62] }
        zoom={ 10 }
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
        />
        { currentYearData.length > 0 ? (
          <GeoJSON
            data={ RAW_COMMUNITY_AREAS }
            onEachFeature={ setAreaInteraction }
            key={ maxNumPermits }
          />
        ) : null }
      </MapContainer>
    </>
  )
}
