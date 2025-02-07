package models

type Files struct {
	ID        int    `json:"id"`
	UserId    string `json:"user_id"`
	Path      string `json:"path"`
	Filename  string `json:"filename"`
	Size      int    `json:"size"`
	MimeType  string `json:"mime_type"`
	CreatedAt string `json:"created_at"`
}
