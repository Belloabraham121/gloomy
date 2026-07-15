import { z } from "zod/v4";

/**
 * Real disk/photo upload into a generated OpenUI page (not a URL-only
 * Image/ImageBlock). Fronted by apps/web's ImageUpload + apps/api's
 * POST /api/uploads/images. See docs/openui-migration.md.
 */
export const imageUploadSchema = z.object({
  label: z
    .string()
    .optional()
    .describe('Heading above the dropzone, e.g. "Hero photo" or "Product shots".'),
  description: z
    .string()
    .optional()
    .describe("Short help text under the label."),
  multiple: z
    .boolean()
    .optional()
    .describe("Allow more than one image. Default false."),
  maxFiles: z
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .describe("Cap when multiple is true (default 4, hard max 12)."),
});

export type ImageUploadProps = z.infer<typeof imageUploadSchema>;

export const imageUploadDescription =
  "Lets the user pick real image files from their device (JPEG/PNG/WebP/GIF), uploads them to gloomy's API, and shows previews. After upload they can continue the conversation with the public image URL(s) so the next turn can place them via Image/ImageBlock/ImageGallery. Nest inside a Stack when used under Card/Tabs/etc.";
