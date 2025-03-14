import { Folder, File } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "./sidebar";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "./tooltip";

export type TTreeItem = {
  label: string;
  path: string;
};

export type TTreeMenu = TTreeItem & {
  menus: TTreeMenu[];
  items: TTreeItem[];
};

/**
 * Root of the Tree component for displaying a tree of folders and articles
 * @param items - The items to display
 * @returns A React component that displays the tree
 */
export const Tree = ({ items }: { items: TTreeMenu[] }) => {
  return (
    <TooltipProvider>
      <SidebarMenu>
        {items.map((item, index) => (
          <TreeMenu key={`${item.label}-${index}`} item={item} />
        ))}
      </SidebarMenu>
    </TooltipProvider>
  );
};

/**
 * TreeMenu component for displaying a single folder in the tree
 * @param item - The item to display
 * @returns A React component that displays the item - a branch of the tree
 */
export const TreeMenu = ({ item }: { item: TTreeMenu }) => {
  const { label, path, menus, items } = item;

  return (
    <Collapsible defaultOpen={false}>
      <SidebarMenuItem>
        {/* Current Folder menu  */}
        <SidebarMenuButton asChild tooltip={path}>
          <a href={path}>
            <Folder />
            <span className="text-overflow-ellipsis overflow-hidden whitespace-nowrap">
              {label}
            </span>
          </a>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            className={cn(
              "[&[data-state=open]>svg]:rotate-90",
              "w-6 h-6",
              "flex items-center justify-center",
              "top-1"
            )}
          >
            <ChevronRight className="transition-transform ml-0" />
            <span className="sr-only">Toggle</span>
          </SidebarMenuAction>
        </CollapsibleTrigger>
        {/* Subfolders and articles */}
        <CollapsibleContent>
          {/* Subfolders */}
          <SidebarMenuSub>
            {menus.map((subItem, index) => (
              <TreeMenu key={`${subItem.label}-${index}`} item={subItem} />
            ))}
            {/* Articles */}
            {items.map((subItem, index) => (
              <TreeItem key={`${subItem.label}-${index}`} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

/**
 * TreeItem component for displaying a single item in the tree
 * @param item - The item to display
 * @returns A React component that displays the item - a leaf of the tree
 */
export const TreeItem = ({ item }: { item: TTreeItem }) => {
  const { label, path } = item;

  return (
    <SidebarMenuButton
      isActive={path === "button.tsx"}
      className="data-[active=true]:bg-transparent text-overflow-ellipsis overflow-hidden whitespace-nowrap"
      tooltip={path}
    >
      <File />
      <div className="text-overflow-ellipsis overflow-hidden whitespace-nowrap">
        {label}
      </div>
    </SidebarMenuButton>
  );
};
