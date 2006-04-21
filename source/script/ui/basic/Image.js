/* ************************************************************************

   qooxdoo - the new era of web interface development

   Copyright:
     (C) 2004-2006 by Schlund + Partner AG, Germany
         All rights reserved

   License:
     LGPL 2.1: http://creativecommons.org/licenses/LGPL/2.1/

   Internet:
     * http://qooxdoo.oss.schlund.de

   Authors:
     * Sebastian Werner (wpbasti)
       <sebastian dot werner at 1und1 dot de>
     * Andreas Ecker (aecker)
       <andreas dot ecker at 1und1 dot de>

************************************************************************ */

/* ************************************************************************

#package(image)
#package(guicore)
#post(qx.manager.object.ImageManager)
#post(qx.io.image.ImagePreloader)

************************************************************************ */

/*!
  This widget is for all images in qooxdoo projects.
*/
qx.ui.basic.Image = function(vSource, vWidth, vHeight)
{
  qx.ui.basic.Terminator.call(this);

  // Reset Alt and Title
  this.setHtmlProperty(qx.ui.basic.Image.ATTR_ALT, qx.Const.CORE_EMPTY);
  this.setHtmlProperty(qx.ui.basic.Image.ATTR_TITLE, qx.Const.CORE_EMPTY);

  // Apply constructor arguments
  this.setSource(qx.util.Validation.isValid(vSource) ? vSource : qx.manager.object.ImageManager.buildUri(qx.Const.IMAGE_BLANK));

  // Dimensions
  this.setWidth(qx.util.Validation.isValid(vWidth) ? vWidth : qx.Const.CORE_AUTO);
  this.setHeight(qx.util.Validation.isValid(vHeight) ? vHeight : qx.Const.CORE_AUTO);

  // Prohibit selection
  this.setSelectable(false);
};

qx.ui.basic.Image.extend(qx.ui.basic.Terminator, "qx.ui.basic.Image");

qx.ui.basic.Image.ATTR_ALT = qx.Const.KEY_ALT;
qx.ui.basic.Image.ATTR_TITLE = "title";

qx.ui.basic.Image.BORDER_NONE = "0 none";
qx.ui.basic.Image.RESET_VALIGN = "top";


/*
---------------------------------------------------------------------------
  PROPERTIES
---------------------------------------------------------------------------
*/

/*!
  The source uri of the image.
*/
qx.ui.basic.Image.addProperty({ name : "source", type : qx.Const.TYPEOF_STRING });

/*!
  The assigned preloader instance of the image.
*/
qx.ui.basic.Image.addProperty({ name : "preloader", type : qx.Const.TYPEOF_OBJECT });

/*!
  The loading status.

  True if the image is loaded correctly. False if no image is loaded
  or the one that should be loaded is currently loading or not available.
*/
qx.ui.basic.Image.addProperty({ name : "loaded", type : qx.Const.TYPEOF_BOOLEAN, defaultValue : false });

/*!
  Should the image be maxified in it's own container?
*/
qx.ui.basic.Image.addProperty({ name : "resizeToInner", type : qx.Const.TYPEOF_BOOLEAN, defaultValue : false });

/*!
  Appearance of the widget
*/
qx.ui.basic.Image.changeProperty({ name : "appearance", type : qx.Const.TYPEOF_STRING, defaultValue : "image" });





/*
---------------------------------------------------------------------------
  EVENT MAPPERS
---------------------------------------------------------------------------
*/

proto._onload = function() {
  this.setLoaded(true);
};

proto._onerror = function()
{
  this.debug("Could not load: " + this.getSource());

  this.setLoaded(false);

  if (this.hasEventListeners(qx.Const.EVENT_TYPE_ERROR)) {
    this.dispatchEvent(new qx.event.types.Event(qx.Const.EVENT_TYPE_ERROR), true);
  };
};





/*
---------------------------------------------------------------------------
  DISPLAYBLE HANDLING
---------------------------------------------------------------------------
*/

proto._beforeAppear = function()
{
  var vSource = this.getSource();

  if (qx.util.Validation.isValidString(vSource)) {
    qx.manager.object.ImageManager._sources[vSource]++;
  };

  return qx.ui.basic.Terminator.prototype._beforeAppear.call(this);
};

proto._beforeDisappear = function()
{
  var vSource = this.getSource();

  if (qx.util.Validation.isValidString(vSource))
  {
    if (qx.manager.object.ImageManager._sources[vSource] == 1)
    {
      delete qx.manager.object.ImageManager._sources[vSource];
    }
    else
    {
      qx.manager.object.ImageManager._sources[vSource]--;
    };
  };

  return qx.ui.basic.Terminator.prototype._beforeDisappear.call(this);
};





/*
---------------------------------------------------------------------------
  MODIFIERS
---------------------------------------------------------------------------
*/

proto._modifySource = function(propValue, propOldValue, propData)
{
  if (propValue && typeof qx.manager.object.ImageManager._sources[propValue] === qx.Const.TYPEOF_UNDEFINED) {
    qx.manager.object.ImageManager._sources[propValue] = 0;
  };

  if (propOldValue)
  {
    if (qx.manager.object.ImageManager._sources[propValue] == 1)
    {
      delete qx.manager.object.ImageManager._sources[propValue];
    }
    else
    {
      qx.manager.object.ImageManager._sources[propValue]--;
    };
  };

  if (this.isCreated())
  {
    if (propValue)
    {
      this.setPreloader(qx.manager.object.ImagePreloaderManager.create(qx.manager.object.ImageManager.buildUri(propValue)));
    }
    else if (propOldValue)
    {
      this._resetContent();
      this.setPreloader(null);
    };
  };

  return true;
};

proto._modifyPreloader = function(propValue, propOldValue, propData)
{
  if (propOldValue)
  {
    // remove event connection
    propOldValue.removeEventListener(qx.Const.EVENT_TYPE_LOAD, this._onload, this);
    propOldValue.removeEventListener(qx.Const.EVENT_TYPE_ERROR, this._onerror, this);
  };

  if (propValue)
  {
    // Register to image manager
    qx.manager.object.ImageManager.add(this);

    // Omit  here, otherwise the later setLoaded(true)
    // will not be executed (prevent recursion)

    // Changed: Use forceLoaded instead of setLoaded => should be faster
    this.forceLoaded(false);

    if (propValue.isErroneous())
    {
      this._onerror();
    }
    else if (propValue.isLoaded())
    {
      this.setLoaded(true);
    }
    else
    {
      propValue.addEventListener(qx.Const.EVENT_TYPE_LOAD, this._onload, this);
      propValue.addEventListener(qx.Const.EVENT_TYPE_ERROR, this._onerror, this);
    };
  }
  else
  {
    // Remove from image manager
    qx.manager.object.ImageManager.remove(this);

    this.setLoaded(false);
  };

  return true;
};

proto._modifyLoaded = function(propValue, propOldValue, propData)
{
  if (propValue && this.isCreated())
  {
    this._applyContent();
  }
  else if (!propValue)
  {
    this._invalidatePreferredInnerWidth();
    this._invalidatePreferredInnerHeight();
  };

  return true;
};

proto._modifyElement = function(propValue, propOldValue, propData)
{
  if (propValue)
  {
    if (!this._image)
    {
      this._image = new Image;

      // Possible alternative for MSHTML for PNG images
      // But it seems not to be faster
      // this._image = document.createElement(qx.Const.CORE_DIV);

      // this costs much performance, move setup to blank gif to error handling
      // is this SSL save?
      // this._image.src = qx.manager.object.ImageManager.buildUri(qx.Const.IMAGE_BLANK);

      this._image.style.border = qx.ui.basic.Image.BORDER_NONE;
      this._image.style.verticalAlign = qx.ui.basic.Image.RESET_VALIGN;

      if (!qx.sys.Client.isMshtml()) {
        this._applyEnabled();
      };
    };

    propValue.appendChild(this._image);
  };

  // call widget implmentation
  qx.ui.basic.Terminator.prototype._modifyElement.call(this, propValue, propOldValue, propData);

  if (propValue)
  {
    // initialisize preloader
    var vSource = this.getSource();
    if (qx.util.Validation.isValidString(vSource)) {
      this.setPreloader(qx.manager.object.ImagePreloaderManager.create(qx.manager.object.ImageManager.buildUri(vSource)));
    };
  };

  return true;
};





/*
---------------------------------------------------------------------------
  CLIENT OPTIMIZED MODIFIERS
---------------------------------------------------------------------------
*/

proto._postApply = function()
{
  if (!this.getLoaded()) {
    return;
  };

  this._postApplyDimensions();
  this._updateContent();
};

if (qx.sys.Client.isMshtml())
{
  qx.ui.basic.Image.IMGLOADER_START = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='";
  qx.ui.basic.Image.IMGLOADER_STOP = "',sizingMethod='scale')";
  qx.ui.basic.Image.FILTER_GRAY = "Gray() Alpha(Opacity=30)";

  proto._modifyEnabled = function(propValue, propOldValue, propData)
  {
    if (this._image) {
      this._applyEnabled();
    };

    return qx.ui.basic.Terminator.prototype._modifyEnabled.call(this, propValue, propOldValue, propData);
  };

  proto._updateContent = function(vSource)
  {
    var i = this._image;
    var pl = this.getPreloader();

    if (pl.getIsPng() && this.getEnabled())
    {
      i.src = qx.manager.object.ImageManager.buildUri(qx.Const.IMAGE_BLANK);
      i.style.filter = qx.ui.basic.Image.IMGLOADER_START + (vSource || pl.getSource()) + qx.ui.basic.Image.IMGLOADER_STOP;
    }
    else
    {
      i.src = vSource || pl.getSource();
      i.style.filter = this.getEnabled() ? qx.Const.CORE_EMPTY : qx.ui.basic.Image.FILTER_GRAY;
    };
  };

  proto._resetContent = function()
  {
    var i = this._image;

    i.src = qx.manager.object.ImageManager.buildUri(qx.Const.IMAGE_BLANK);
    i.style.filter = qx.Const.CORE_EMPTY;
  };

  proto._applyEnabled = proto._postApply;
}
else
{
  proto._postApply = function()
  {
    if (!this.getLoaded()) {
      return;
    };

    this._postApplyDimensions();
    this._updateContent();
  };

  proto._updateContent = function(vSource) {
    this._image.src = vSource || this.getPreloader().getSource();
  };

  proto._resetContent = function() {
    this._image.src = qx.manager.object.ImageManager.buildUri(qx.Const.IMAGE_BLANK);
  };

  proto._applyEnabled = function()
  {
    if (this._image)
    {
      var o = this.getEnabled() ? qx.Const.CORE_EMPTY : 0.3;
      var s = this._image.style;

      s.opacity = s.KhtmlOpacity = s.MozOpacity = o;
    };
  };

  proto._modifyEnabled = function(propValue, propOldValue, propData)
  {
    if (this._image) {
      this._applyEnabled();
    };

    return qx.ui.basic.Terminator.prototype._modifyEnabled.call(this, propValue, propOldValue, propData);
  };
};







/*
---------------------------------------------------------------------------
  PREFERRED DIMENSIONS: INNER
---------------------------------------------------------------------------
*/

proto._computePreferredInnerWidth = function()
{
  if (this.getLoaded())
  {
    return this.getPreloader().getWidth();
  }
  else if (qx.util.Validation.isValidString(this.getSource()))
  {
    var vPreloader = qx.manager.object.ImagePreloaderManager.get(qx.manager.object.ImageManager.buildUri(this.getSource()));

    if (vPreloader && vPreloader.isLoaded()) {
      return vPreloader.getWidth();
    };
  };

  return 0;
};

proto._computePreferredInnerHeight = function()
{
  if (this.getLoaded())
  {
    return this.getPreloader().getHeight();
  }
  else if (qx.util.Validation.isValidString(this.getSource()))
  {
    var vPreloader = qx.manager.object.ImagePreloaderManager.get(qx.manager.object.ImageManager.buildUri(this.getSource()));

    if (vPreloader && vPreloader.isLoaded()) {
      return vPreloader.getHeight();
    };
  };

  return 0;
};







/*
---------------------------------------------------------------------------
  APPLY
---------------------------------------------------------------------------
*/

proto._applyContent = function()
{
  qx.ui.basic.Terminator.prototype._applyContent.call(this);

  // Images load asyncron, so we need to force flushing here
  // to get an up-to-date view when an image is loaded.
  qx.ui.core.Widget.flushGlobalQueues();
};

if (qx.sys.Client.isMshtml())
{
  proto._postApplyDimensions = function()
  {
    try
    {
      var vImageStyle = this._image.style;

      if (this.getResizeToInner())
      {
        vImageStyle.pixelWidth = this.getInnerWidth();
        vImageStyle.pixelHeight = this.getInnerHeight();
      }
      else
      {
        vImageStyle.pixelWidth = this.getPreferredInnerWidth();
        vImageStyle.pixelHeight = this.getPreferredInnerHeight();
      };
    }
    catch(ex)
    {
      this.error(ex, "_postApplyDimensions");
    };
  };
}
else
{
  proto._postApplyDimensions = function()
  {
    try
    {
      var vImageNode = this._image;

      if (this.getResizeToInner())
      {
        vImageNode.width = this.getInnerWidth();
        vImageNode.height = this.getInnerHeight();
      }
      else
      {
        vImageNode.width = this.getPreferredInnerWidth();
        vImageNode.height = this.getPreferredInnerHeight();
      };
    }
    catch(ex)
    {
      this.error(ex, "_postApplyDimensions");
    };
  };
};




/*
---------------------------------------------------------------------------
  CHANGES IN DIMENSIONS
---------------------------------------------------------------------------
*/

if (qx.sys.Client.isMshtml())
{
  proto._changeInnerWidth = function(vNew, vOld)
  {
    if (this.getResizeToInner()) {
      this._image.style.pixelWidth = vNew;
    };
  };

  proto._changeInnerHeight = function(vNew, vOld)
  {
    if (this.getResizeToInner()) {
      this._image.style.pixelHeight = vNew;
    };
  };
}
else
{
  proto._changeInnerWidth = function(vNew, vOld)
  {
    if (this.getResizeToInner()) {
      this._image.width = vNew;
    };
  };

  proto._changeInnerHeight = function(vNew, vOld)
  {
    if (this.getResizeToInner()) {
      this._image.height = vNew;
    };
  };
};





/*
---------------------------------------------------------------------------
  DISPOSER
---------------------------------------------------------------------------
*/

proto.dispose = function()
{
  if (this.getDisposed()) {
    return true;
  };

  var vPreloader = this.getPreloader();
  if (vPreloader)
  {
    // remove event connection
    vPreloader.removeEventListener(qx.Const.EVENT_TYPE_LOAD, this._onload, this);
    vPreloader.removeEventListener(qx.Const.EVENT_TYPE_ERROR, this._onerror, this);

    this.forcePreloader(null);
  };

  if (this._image)
  {
    // Remove leaking filter attribute before leaving page
    this._image.style.filter = qx.Const.CORE_EMPTY;
    this._image = null;
  };

  qx.manager.object.ImageManager.remove(this);

  return qx.ui.basic.Terminator.prototype.dispose.call(this);
};
