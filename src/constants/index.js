const getMapBoxToken = () => {
  const deployMode = process.env.REACT_APP_DEPLOY_MODE || "development";
  const devKey = process.env.REACT_APP_MAPBOX_DEV_KEY;
  const prodKey = process.env.REACT_APP_MAPBOX_PROD_KEY;

  if (deployMode === "production") {
    return prodKey;
  }

  return devKey;
};

const MAPBOX_ACCESS_TOKEN = getMapBoxToken();

module.exports = {
  MAPBOX_ACCESS_TOKEN,
};
