import BaseLayer from 'ol/layer/Base';
import TileLayer from 'ol/layer/Tile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import XYZ, { Options as SourceOptions } from 'ol/source/XYZ';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import { Extent } from 'ol/extent';

import defaultsDeep from 'lodash/defaultsDeep';

import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeGeoviewLayerConfig,
  layerEntryIsGroupLayer,
  TypeFeatureInfoLayerConfig,
} from '@/geo/map/map-schema-types';
import { Cast, toJsonObject } from '@/core/types/global-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';

// ? Do we keep this TODO ? Dynamic parameters can be placed on the dataAccessPath and initial settings can be used on xyz-tiles.
// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

export type TypeSourceImageXYZTilesInitialConfig = TypeSourceTileInitialConfig;

export interface TypeXYZTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.XYZ_TILES;
  listOfLayerEntryConfig: XYZTilesLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeXYZTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsXYZTiles = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeXYZTilesConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an XYZTiles if the type attribute of the verifyIfGeoViewLayer
 * parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsXYZTiles = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is XYZTiles => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.XYZ_TILES;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a XYZTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is XYZ_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsXYZTiles = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is XYZTilesLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * a class to add xyz-tiles layer
 *
 * @exports
 * @class XYZTiles
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export class XYZTiles extends AbstractGeoViewRaster {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeXYZTilesConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeXYZTilesConfig) {
    super(CONST_LAYER_TYPES.XYZ_TILES, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {TypeOutfieldsType} The type of the field.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): TypeOutfieldsType {
    const fieldDefinitions = this.getLayerMetadata(layerConfig.layerPath).source.featureInfo as unknown as TypeFeatureInfoLayerConfig;
    const outFieldEntry = fieldDefinitions.outfields?.find((fieldDefinition) => fieldDefinition.name === fieldName);
    return outFieldEntry?.type || 'string';
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStatus = 'error';
          return;
        }
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.layerStatus = 'processing';

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      // Note that XYZ metadata as we defined it does not contains metadata layer group. If you need geogson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerConfig.layerId);
        if (!foundEntry) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `XYZ layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStatus = 'error';
          return;
        }
        return;
      }

      throw new Error(
        `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`
      );
    });
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView XYZTiles layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView raster layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config? in layers?)
  protected override async processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);

    // Instance check
    if (!(layerConfig instanceof XYZTilesLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    const sourceOptions: SourceOptions = {
      url: layerConfig.source.dataAccessPath,
    };
    if (layerConfig.source.crossOrigin) {
      sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
    } else {
      sourceOptions.crossOrigin = 'Anonymous';
    }
    if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;
    if (layerConfig.source.tileGrid) {
      const tileGridOptions: TileGridOptions = {
        origin: layerConfig.source.tileGrid?.origin,
        resolutions: layerConfig.source.tileGrid?.resolutions as number[],
      };
      if (layerConfig.source.tileGrid?.tileSize) tileGridOptions.tileSize = layerConfig.source.tileGrid?.tileSize;
      if (layerConfig.source.tileGrid?.extent) tileGridOptions.extent = layerConfig.source.tileGrid?.extent;
      sourceOptions.tileGrid = new TileGrid(tileGridOptions);
    }

    // Create the source
    const source = new XYZ(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: TileLayer<XYZ> | undefined;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as TileLayer<XYZ>;
    }

    // If no olLayer was obtained
    if (!olLayer) {
      // We're working in old LAYERS_HYBRID_MODE (in the new mode the code below is handled in the new classes)
      const tileLayerOptions: TileOptions<XYZ> = { source };
      // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
      if (layerConfig.initialSettings?.className !== undefined) tileLayerOptions.className = layerConfig.initialSettings.className;
      if (layerConfig.initialSettings?.extent !== undefined) tileLayerOptions.extent = layerConfig.initialSettings.extent;
      if (layerConfig.initialSettings?.maxZoom !== undefined) tileLayerOptions.maxZoom = layerConfig.initialSettings.maxZoom;
      if (layerConfig.initialSettings?.minZoom !== undefined) tileLayerOptions.minZoom = layerConfig.initialSettings.minZoom;
      if (layerConfig.initialSettings?.states?.opacity !== undefined) tileLayerOptions.opacity = layerConfig.initialSettings.states.opacity;
      // GV IMPORTANT: The initialSettings.visible flag must be set in the layerConfig.loadedFunction otherwise the layer will stall
      // GV            in the 'loading' state if the flag value is false.

      // Create the OpenLayer layer
      olLayer = new TileLayer(tileLayerOptions);

      // Hook the loaded event
      this.setLayerAndLoadEndListeners(layerConfig, olLayer, 'tile');
    }

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    return Promise.resolve(olLayer);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof XYZTilesLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    if (this.metadata) {
      const metadataLayerConfigFound = Cast<XYZTilesLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig).find(
        (metadataLayerConfig) => metadataLayerConfig.layerId === layerConfig.layerId
      );
      // metadataLayerConfigFound can not be undefined because we have already validated the config exist
      this.setLayerMetadata(layerConfig.layerPath, toJsonObject(metadataLayerConfigFound));
      // eslint-disable-next-line no-param-reassign
      layerConfig.source = defaultsDeep(layerConfig.source, metadataLayerConfigFound!.source);
      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings = defaultsDeep(layerConfig.initialSettings, metadataLayerConfigFound!.initialSettings);
      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);
    }
    return Promise.resolve(layerConfig);
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   *
   * @returns {Extent | undefined} The new layer bounding box.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  override getBounds(layerPath: string): Extent | undefined {
    // Get the layer
    const layer = this.getOLLayer(layerPath) as TileLayer<XYZ> | undefined;

    // Get the source projection
    const sourceProjection = this.getSourceProjection(layerPath);

    // Get the layer bounds
    let sourceExtent = layer?.getSource()?.getTileGrid()?.getExtent();
    if (sourceExtent) {
      // Make sure we're in the map projection
      sourceExtent = this.getMapViewer().convertExtentFromProjToMapProj(sourceExtent, sourceProjection);
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }
}
