import React from "react";
import {
  PlusOutlined,
  BookOutlined,
  FileTextOutlined,
  StarOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  FolderAddOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  TagsOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  NotesSidebar,
  SidebarSection,
  NewNoteButton,
  SidebarSectionTitle,
  SectionTitleLabel,
  SidebarList,
  SidebarItemButton,
  SidebarItemLabel,
  SidebarItemMeta,
  SidebarActionButton,
  FolderRow,
  FolderCaretButton,
  FolderDeleteButton,
  FolderNoteList,
  FolderNoteButton,
  SidebarHint,
  TagDot,
  RemoveTagButton,
} from "../Notes.styles";

function NotesSidebarPanel({
  accessToken,
  texts,
  libraryFilter,
  libraryCounts,
  onCreateNote,
  onSelectLibrary,
  onLoadAllNotes,
  onLoadSharedNotes,
  folders,
  activeFolderId,
  openedFolders,
  notesByFolderId,
  folderCounts,
  selectedNoteId,
  onToggleFolder,
  onSelectFolder,
  onOpenFolderForNote,
  onAddFolder,
  onDeleteFolder,
  tags,
  activeTagIds,
  tagUsageCounts,
  onToggleTagFilter,
  onRemoveTag,
  onAddTag,
}) {
  const handleLibraryClick = (nextFilter) => {
    onSelectLibrary(nextFilter);
    if (nextFilter === "all") {
      onLoadAllNotes();
      return;
    }
    if (nextFilter === "shared") {
      onLoadSharedNotes();
    }
  };

  return (
    <NotesSidebar>
      <SidebarSection>
        <NewNoteButton
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={onCreateNote}
        >
          {texts.newNote}
        </NewNoteButton>
      </SidebarSection>

      <SidebarSection>
        <SidebarSectionTitle>
          <SectionTitleLabel>
            <BookOutlined /> {texts.library}
          </SectionTitleLabel>
        </SidebarSectionTitle>
        <SidebarList>
          <li>
            <SidebarItemButton
              type="button"
              $active={libraryFilter === "all"}
              onClick={() => handleLibraryClick("all")}
            >
              <SidebarItemLabel>
                <FileTextOutlined /> {texts.allNotes}
              </SidebarItemLabel>
              <SidebarItemMeta>{libraryCounts.all}</SidebarItemMeta>
            </SidebarItemButton>
          </li>
          <li>
            <SidebarItemButton
              type="button"
              $active={libraryFilter === "favorites"}
              onClick={() => handleLibraryClick("favorites")}
            >
              <SidebarItemLabel>
                <StarOutlined /> {texts.favorites}
              </SidebarItemLabel>
              <SidebarItemMeta>{libraryCounts.favorites}</SidebarItemMeta>
            </SidebarItemButton>
          </li>
          <li>
            <SidebarItemButton
              type="button"
              $active={libraryFilter === "trash"}
              onClick={() => handleLibraryClick("trash")}
            >
              <SidebarItemLabel>
                <DeleteOutlined /> {texts.trash}
              </SidebarItemLabel>
              <SidebarItemMeta>{libraryCounts.trash}</SidebarItemMeta>
            </SidebarItemButton>
          </li>
          <li>
            <SidebarItemButton
              type="button"
              $active={libraryFilter === "shared"}
              onClick={() => handleLibraryClick("shared")}
              disabled={!accessToken}
            >
              <SidebarItemLabel>
                <ShareAltOutlined /> {texts.sharedNotes}
              </SidebarItemLabel>
              <SidebarItemMeta>{libraryCounts.shared}</SidebarItemMeta>
            </SidebarItemButton>
          </li>
        </SidebarList>
      </SidebarSection>

      <SidebarSection>
        <SidebarSectionTitle>
          <SectionTitleLabel>
            <FolderOpenOutlined /> {texts.folders}
          </SectionTitleLabel>
          <SidebarActionButton
            type="text"
            size="small"
            icon={<FolderAddOutlined />}
            onClick={onAddFolder}
          />
        </SidebarSectionTitle>

        <SidebarList>
          {folders.map((folder) => {
            const isActive = activeFolderId === folder.id;
            const isOpen = !!openedFolders[folder.id];
            const folderNotes = notesByFolderId[folder.id] || [];

            return (
              <li key={folder.id}>
                <FolderRow>
                  <FolderCaretButton
                    type="text"
                    size="small"
                    icon={isOpen ? <CaretDownOutlined /> : <CaretRightOutlined />}
                    onClick={() => onToggleFolder(folder.id)}
                  />
                  <SidebarItemButton
                    type="button"
                    $active={isActive}
                    onClick={() => onSelectFolder(folder)}
                  >
                    <SidebarItemLabel>
                      {isOpen ? <FolderOpenOutlined /> : <FolderOutlined />}
                      {folder.title}
                    </SidebarItemLabel>
                    <SidebarItemMeta>
                      {(folderCounts[folder.id] ?? 0) > 0 ? folderCounts[folder.id] : ""}
                    </SidebarItemMeta>
                  </SidebarItemButton>
                  <FolderDeleteButton
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    title={texts.deleteFolder}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteFolder(folder.id);
                    }}
                  />
                </FolderRow>

                {isOpen && folderNotes.length > 0 && (
                  <FolderNoteList>
                    {folderNotes.map((note) => (
                      <li key={note.id}>
                        <FolderNoteButton
                          type="button"
                          className={note.id === selectedNoteId ? "is-active" : ""}
                          onClick={() => onOpenFolderForNote(folder.id, note.id)}
                        >
                          <FileTextOutlined />
                          <span>{note.title}</span>
                        </FolderNoteButton>
                      </li>
                    ))}
                  </FolderNoteList>
                )}
              </li>
            );
          })}

          {folders.length === 0 && (
            <li>
              <SidebarHint>{texts.noFoldersHint}</SidebarHint>
            </li>
          )}
        </SidebarList>
      </SidebarSection>

      <SidebarSection>
        <SidebarSectionTitle>
          <SectionTitleLabel>
            <TagsOutlined /> {texts.tags}
          </SectionTitleLabel>
          <SidebarActionButton
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={onAddTag}
          />
        </SidebarSectionTitle>

        <SidebarList>
          {tags.map((tag) => {
            const isActive = activeTagIds.includes(tag.id);
            return (
              <li key={tag.id}>
                <SidebarItemButton
                  type="button"
                  $active={isActive}
                  onClick={() => onToggleTagFilter(tag.id)}
                >
                  <SidebarItemLabel>
                    <TagDot $color={tag.color} />
                    {tag.name}
                  </SidebarItemLabel>

                  <SidebarItemMeta>
                    <span>{(tagUsageCounts[tag.id] ?? 0) > 0 ? tagUsageCounts[tag.id] : ""}</span>
                    <RemoveTagButton
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveTag(tag.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          onRemoveTag(tag.id);
                        }
                      }}
                    >
                      <CloseOutlined />
                    </RemoveTagButton>
                  </SidebarItemMeta>
                </SidebarItemButton>
              </li>
            );
          })}
        </SidebarList>
      </SidebarSection>
    </NotesSidebar>
  );
}

export default NotesSidebarPanel;
