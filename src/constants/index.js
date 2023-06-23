const getMapBoxToken = () => {
  const deployMode = process.env.REACT_APP_DEPLOY_MODE || "development";
  const devKey =
    process.env.REACT_APP_MAPBOX_DEV_KEY ||
    "pk.eyJ1IjoicmVlY290ZWNoLW1hcGJveCIsImEiOiJjbDNpaTFoZHgwNDhpM2lvOHN0NTZmc2hsIn0.XjrYjmewpbxhqvrn-9QqpA";
  const prodKey =
    process.env.REACT_APP_MAPBOX_PROD_KEY ||
    "pk.eyJ1IjoicmVlY290ZWNoLW1hcGJveCIsImEiOiJjbDNqaDRnNHkwZWJuM2JxaWZhcGdteWxjIn0.e5wTJ5qAlgScJBcWlKMUmQ";

  if (deployMode === "production") {
    return prodKey;
  }

  return devKey;
};

const MAPBOX_ACCESS_TOKEN = getMapBoxToken();

module.exports = {
  MAPBOX_ACCESS_TOKEN,
};
