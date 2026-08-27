import React from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SellerCategoryId } from "@/lib/seller-categories";
import type { ProductVariant } from "@/lib/product-variants";
import PhotosSection from "./PhotosSection";
import NameDescriptionSection from "./NameDescriptionSection";
import SubcategoryPicker from "./SubcategoryPicker";
import PriceStockSection from "./PriceStockSection";
import MoreOptionsAccordion from "./MoreOptionsAccordion";
import CompactPreviewStrip from "./CompactPreviewStrip";
import FashionComposer from "./FashionComposer";
import ShoesComposer from "./ShoesComposer";
import ThriftComposer from "./ThriftComposer";
import ElectronicsComposer from "./ElectronicsComposer";
import BeautyComposer from "./BeautyComposer";
import HomeComposer from "./HomeComposer";
import JewelryComposer from "./JewelryComposer";
import GymComposer from "./GymComposer";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface AddProductComposerProps {
  sellerCategory: SellerCategoryId;
  isEditing: boolean;
  onBack: () => void;

  // Photos
  existingImages: string[];
  imagePreviews: string[];
  onAddImages: (files: File[]) => void;
  onRemoveExistingImage: (i: number) => void;
  onRemoveNewImage: (i: number) => void;
  videoPreview: string;
  existingVideoUrl: string;
  onAddVideo: (f: File) => void;
  onRemoveVideo: () => void;

  // Name/Description
  title: string; onTitleChange: (v: string) => void;
  description: string; onDescriptionChange: (v: string) => void;
  showAIGenerate: boolean;
  onGenerateAI?: () => void;
  generatingAI: boolean;
  aiError: string;

  // Subcategory
  department: string; onDepartmentChange: (v: string) => void;
  subcategory: string; onSubcategoryChange: (v: string) => void;

  // Shared descriptive fields
  color: string; onColorChange: (v: string) => void;
  size: string; onSizeChange: (v: string) => void;
  fit: string; onFitChange: (v: string) => void;
  material: string; onMaterialChange: (v: string) => void;
  occasion: string; onOccasionChange: (v: string) => void;
  audience: string; onAudienceChange: (v: string) => void;
  aesthetics: string[]; onAestheticsChange: (v: string[]) => void;
  brand: string; onBrandChange: (v: string) => void;
  thriftCondition: string; onThriftConditionChange: (v: string) => void;
  electronicsCondition: string; onElectronicsConditionChange: (v: string) => void;
  warranty: string; onWarrantyChange: (v: string) => void;
  shadeType: string; onShadeTypeChange: (v: string) => void;
  volumeSize: string; onVolumeSizeChange: (v: string) => void;
  powerSource: string; onPowerSourceChange: (v: string) => void;
  adjustable: string; onAdjustableChange: (v: string) => void;

  // Variants
  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSizes: string[]; setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedShoeSizes: string[]; setSelectedShoeSizes: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;

  // Price/stock
  price: string; onPriceChange: (v: string) => void;
  stock: string; onStockChange: (v: string) => void;

  // More options
  sellerNote: string; onSellerNoteChange: (v: string) => void;
  packageSize: string; onPackageSizeChange: (v: string) => void;
  expiryDate: string; onExpiryDateChange: (v: string) => void;
  dimensions: string; onDimensionsChange: (v: string) => void;

  // Submit
  uploadError: string | null;
  uploading: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export default function AddProductComposer(props: AddProductComposerProps) {
  const {
    sellerCategory, isEditing, onBack,
    existingImages, imagePreviews, onAddImages, onRemoveExistingImage, onRemoveNewImage,
    videoPreview, existingVideoUrl, onAddVideo, onRemoveVideo,
    title, onTitleChange, description, onDescriptionChange, showAIGenerate, onGenerateAI, generatingAI, aiError,
    department, onDepartmentChange, subcategory, onSubcategoryChange,
    color, onColorChange, size, onSizeChange, fit, onFitChange, material, onMaterialChange,
    occasion, onOccasionChange, audience, onAudienceChange, aesthetics, onAestheticsChange,
    brand, onBrandChange, thriftCondition, onThriftConditionChange,
    electronicsCondition, onElectronicsConditionChange, warranty, onWarrantyChange,
    shadeType, onShadeTypeChange, volumeSize, onVolumeSizeChange,
    powerSource, onPowerSourceChange, adjustable, onAdjustableChange,
    selectedColors, setSelectedColors, selectedSizes, setSelectedSizes, selectedShoeSizes, setSelectedShoeSizes,
    useVariantPricing, setUseVariantPricing, variants, onGenerateVariants, onUpdateVariant,
    price, onPriceChange, stock, onStockChange,
    sellerNote, onSellerNoteChange, packageSize, onPackageSizeChange, expiryDate, onExpiryDateChange,
    dimensions, onDimensionsChange,
    uploadError, uploading, onSaveDraft, onPublish,
  } = props;

  const buyerPrice = price ? Number(price) * 1.095 : 0;
  const mainImage = existingImages[0] || imagePreviews[0];

  const renderCategoryComposer = () => {
    switch (sellerCategory) {
      case "Fashion":
        return (
          <FashionComposer
            color={color} onColorChange={onColorChange}
            size={size} onSizeChange={onSizeChange}
            fit={fit} onFitChange={onFitChange}
            material={material} onMaterialChange={onMaterialChange}
            occasion={occasion} onOccasionChange={onOccasionChange}
            audience={audience} onAudienceChange={onAudienceChange}
            aesthetics={aesthetics} onAestheticsChange={onAestheticsChange}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            selectedSizes={selectedSizes} setSelectedSizes={setSelectedSizes}
            useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
            variants={variants} onGenerateVariants={onGenerateVariants} onUpdateVariant={onUpdateVariant}
          />
        );
      case "Shoes":
        return (
          <ShoesComposer
            brand={brand} onBrandChange={onBrandChange}
            material={material} onMaterialChange={onMaterialChange}
            color={color} onColorChange={onColorChange}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            selectedShoeSizes={selectedShoeSizes} setSelectedShoeSizes={setSelectedShoeSizes}
            useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
            variants={variants} onGenerateVariants={onGenerateVariants} onUpdateVariant={onUpdateVariant}
          />
        );
      case "Thrift":
        return (
          <ThriftComposer
            condition={thriftCondition} onConditionChange={onThriftConditionChange}
            size={size} onSizeChange={onSizeChange}
            color={color} onColorChange={onColorChange}
            brand={brand} onBrandChange={onBrandChange}
          />
        );
      case "Electronics":
        return (
          <ElectronicsComposer
            brand={brand} onBrandChange={onBrandChange}
            condition={electronicsCondition} onConditionChange={onElectronicsConditionChange}
            warranty={warranty} onWarrantyChange={onWarrantyChange}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
            variants={variants} onGenerateVariants={onGenerateVariants} onUpdateVariant={onUpdateVariant}
          />
        );
      case "Beauty & Health":
        return (
          <BeautyComposer
            shadeType={shadeType} onShadeTypeChange={onShadeTypeChange}
            volumeSize={volumeSize} onVolumeSizeChange={onVolumeSizeChange}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
            variants={variants} onGenerateVariants={onGenerateVariants} onUpdateVariant={onUpdateVariant}
          />
        );
      case "Home":
        return (
          <HomeComposer
            subcategory={subcategory}
            material={material} onMaterialChange={onMaterialChange}
            powerSource={powerSource} onPowerSourceChange={onPowerSourceChange}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
            variants={variants} onGenerateVariants={onGenerateVariants} onUpdateVariant={onUpdateVariant}
          />
        );
      case "Jewelry & Accessories":
        return (
          <JewelryComposer
            material={material} onMaterialChange={onMaterialChange}
            color={color} onColorChange={onColorChange}
            adjustable={adjustable} onAdjustableChange={onAdjustableChange}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
            variants={variants} onGenerateVariants={onGenerateVariants} onUpdateVariant={onUpdateVariant}
          />
        );
      case "Gym & Outdoor":
        return (
          <GymComposer
            subcategory={subcategory}
            material={material} onMaterialChange={onMaterialChange}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            selectedSizes={selectedSizes} setSelectedSizes={setSelectedSizes}
            useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
            variants={variants} onGenerateVariants={onGenerateVariants} onUpdateVariant={onUpdateVariant}
          />
        );
      default:
        return null;
    }
  };

  const showPackageSize = sellerCategory !== "Thrift";
  const showExpiryDate = sellerCategory === "Beauty & Health";
  const showDimensions = sellerCategory === "Home";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-base">{isEditing ? "Edit Product" : "Add New Product"}</h1>
            <p className="text-[10px] text-muted-foreground">Listing as: {sellerCategory}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-5">
        <PhotosSection
          existingImages={existingImages}
          imagePreviews={imagePreviews}
          onAddImages={onAddImages}
          onRemoveExisting={onRemoveExistingImage}
          onRemoveNew={onRemoveNewImage}
          videoPreview={videoPreview}
          existingVideoUrl={existingVideoUrl}
          onAddVideo={onAddVideo}
          onRemoveVideo={onRemoveVideo}
        />

        <NameDescriptionSection
          title={title}
          onTitleChange={onTitleChange}
          description={description}
          onDescriptionChange={onDescriptionChange}
          showAIGenerate={showAIGenerate}
          onGenerateAI={onGenerateAI}
          generatingAI={generatingAI}
          aiError={aiError}
        />

        <SubcategoryPicker
          sellerCategory={sellerCategory}
          department={department}
          onDepartmentChange={onDepartmentChange}
          subcategory={subcategory}
          onSubcategoryChange={onSubcategoryChange}
        />

        {renderCategoryComposer()}

        <PriceStockSection
          price={price}
          onPriceChange={onPriceChange}
          stock={stock}
          onStockChange={onStockChange}
        />

        <MoreOptionsAccordion
          sellerNote={sellerNote}
          onSellerNoteChange={onSellerNoteChange}
          showPackageSize={showPackageSize}
          packageSize={packageSize}
          onPackageSizeChange={onPackageSizeChange}
          showExpiryDate={showExpiryDate}
          expiryDate={expiryDate}
          onExpiryDateChange={onExpiryDateChange}
          showDimensions={showDimensions}
          dimensions={dimensions}
          onDimensionsChange={onDimensionsChange}
        />

        <CompactPreviewStrip
          imageUrl={mainImage}
          title={title}
          buyerPrice={buyerPrice}
          expandedContent={
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>{[department || null, subcategory].filter(Boolean).join(" › ") || "No category selected yet"}</p>
              {description && <p className="line-clamp-3">{description}</p>}
              {variants.length > 0 && <p>{variants.length} variant(s) configured</p>}
              <p>Stock: {stock || "—"}</p>
            </div>
          }
        />

        {uploadError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {uploadError}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t border-border px-4 py-3 z-30">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button type="button" variant="outline" className="flex-1 rounded-full h-12 font-bold" disabled={uploading} onClick={onSaveDraft}>
            Save Draft
          </Button>
          <Button type="button" className="flex-1 rounded-full h-12 font-bold" disabled={uploading} onClick={onPublish}>
            {uploading ? "Saving..." : isEditing ? "Save Changes" : "Publish Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
