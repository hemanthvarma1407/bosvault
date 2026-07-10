'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Book, Search, Plus, BookOpen, ChevronRight, FileText, Lock, Shield, Users, Download, Paperclip, Eye } from 'lucide-react';
import { KnowledgeCategoryEnum, CreateArticleRequestModel, UpdateArticleRequestModel, SearchArticleRequestModel, IdRequestModel, UserRoleEnum } from '@bosvault/shared-models';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { KnowledgeBaseService } from '@bosvault/shared-services';

const KnowledgeBasePage: React.FC = () => {
    const { user } = useAuth();
    const [articles, setArticles] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editArticleId, setEditArticleId] = useState<number | null>(null);
    const [newArticle, setNewArticle] = useState<any>({ title: '', category: KnowledgeCategoryEnum.OTHER, content: '', tags: '', isPublished: true, file: null as File | null });
    const kbService = new KnowledgeBaseService();
    const canManage = user && [UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN].includes(user.role as any);

    useEffect(() => {
        if (user) {
            fetchStats();
            searchArticles();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const req = new IdRequestModel(0); // Passing 0 or dummy as we removed companyId filter in backend repository
            const res: any = await kbService.getStats(req);
            if (res && res.byCategory) {
                setStats(res);
            } else if (res && res.data && res.data.byCategory) {
                setStats(res.data);
            } else if (res && res.stats && res.stats.byCategory) {
                setStats(res.stats);
            } else {
                setStats(null);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const searchArticles = async () => {
        try {
            const req = new SearchArticleRequestModel(0, searchQuery); // Passing 0 as dummy
            const res: any = await kbService.searchArticles(req);
            if (Array.isArray(res)) {
                setArticles(res);
            } else if (res && Array.isArray(res.data)) {
                setArticles(res.data);
            } else if (res && Array.isArray(res.articles)) {
                setArticles(res.articles);
            } else {
                setArticles([]);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleDownload = async (article: any) => {
        if (!article.fileUrl) return;
        try {
            const url = kbService.getAttachmentUrl(article.fileUrl);
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', article.fileUrl.split('-').slice(1).join('-') || 'attachment');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleView = async (article: any) => {
        if (!article.fileUrl) return;
        try {
            const url = kbService.getAttachmentUrl(article.fileUrl);
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load attachment');

            const blob = await response.blob();
            const viewUrl = window.URL.createObjectURL(blob);
            window.open(viewUrl, '_blank');
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const tagsArray = newArticle.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);

            if (isEditMode && editArticleId) {
                const req = new UpdateArticleRequestModel(editArticleId, newArticle.title, newArticle.content, newArticle.category, tagsArray, newArticle.isPublished, user!.id);
                const res = await kbService.updateArticle(req, newArticle.file);
                if (res.status) {
                    AlertMessages.getSuccessMessage(res.message);
                    setIsCreateOpen(false);
                    setIsEditMode(false);
                    setEditArticleId(null);
                    setNewArticle({ title: '', category: KnowledgeCategoryEnum.OTHER, content: '', tags: '', isPublished: true, file: null });
                    searchArticles();
                    fetchStats();
                    if (selectedArticle && selectedArticle.id === editArticleId) {
                        setSelectedArticle(null);
                    }
                } else {
                    AlertMessages.getErrorMessage(res.message);
                }
            } else {
                const req = new CreateArticleRequestModel(newArticle.title, newArticle.content, newArticle.category, user!.id, user!.companyId, tagsArray, newArticle.isPublished);
                const res = await kbService.createArticle(req, newArticle.file);
                if (res.status) {
                    AlertMessages.getSuccessMessage(res.message);
                    setIsCreateOpen(false);
                    setNewArticle({ title: '', category: KnowledgeCategoryEnum.OTHER, content: '', tags: '', isPublished: true, file: null });
                    searchArticles();
                    fetchStats();
                } else {
                    AlertMessages.getErrorMessage(res.message);
                }
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const openEditModal = (article: any) => {
        setNewArticle({ title: article.title, category: article.category, content: article.content, tags: article.tags ? article.tags.join(', ') : '', isPublished: article.isPublished, file: null });
        setEditArticleId(article.id);
        setIsEditMode(true);
        setIsCreateOpen(true);
        setSelectedArticle(null);
    };

    const categoryIcons: Record<string, any> = {
        [KnowledgeCategoryEnum.COMPANY_POLICY]: Shield,
        [KnowledgeCategoryEnum.IT_POLICY]: Lock,
        [KnowledgeCategoryEnum.HR_POLICY]: Users,
        [KnowledgeCategoryEnum.OTHER]: Book
    };

    const formatCategory = (cat: string) => {
        if (!cat) return '';
        return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    return (
        <RouteGuard>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-8">
                <PageHeader
                    title="Help Center"
                    description="Centralized repository for IT documentation, guides, and policies."
                    icon={<Book />}
                    gradient="from-cyan-500 to-blue-600"
                    actions={canManage ? [
                        {
                            label: 'Write Article',
                            icon: <Plus className="w-4 h-4" />,
                            onClick: () => { setIsEditMode(false); setEditArticleId(null); setNewArticle({ title: '', category: KnowledgeCategoryEnum.OTHER, content: '', tags: '', isPublished: true, file: null }); setIsCreateOpen(true); },
                            variant: 'primary'
                        }
                    ] : []}
                />

                {/* Hero Search Section */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center shadow-xl">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <h2 className="text-3xl font-black text-white mb-4 relative z-10">
                        How can we help you today?
                    </h2>
                    <div className="max-w-2xl mx-auto relative z-10">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search for answers, error codes, or guides..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition-all font-medium text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchArticles()}
                            />
                            <button
                                onClick={() => searchArticles()}
                                className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                </div>

                {/* Categories & Results */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Filter */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white px-2">Categories</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => { setSelectedCategory(''); searchArticles(); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${!selectedCategory ? 'bg-white dark:bg-slate-900 shadow-md text-cyan-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <Book className="w-4 h-4" />
                                    All Topics
                                </span>
                                {stats && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{stats.total}</span>}
                            </button>
                            {Object.values(KnowledgeCategoryEnum).map((cat) => {
                                const Icon = categoryIcons[cat] || Book;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => { setSelectedCategory(cat); searchArticles(); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-white dark:bg-slate-900 shadow-md text-cyan-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Icon className="w-4 h-4" />
                                            {formatCategory(cat)}
                                        </span>
                                        {stats && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{stats.byCategory[cat] || 0}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-4">
                        {articles.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No articles found</h3>
                                <p className="text-slate-500">Try adjusting your search or category filter.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {articles.map((article) => (
                                    <Card
                                        key={article.id}
                                        className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-cyan-500 cursor-pointer"
                                        onClick={() => setSelectedArticle(article)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            {formatCategory(article.category)}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            {new Date(article.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                        {article.content.substring(0, 200)}...
                                                    </p>
                                                    {article.tags && article.tags.length > 0 && (
                                                        <div className="flex gap-2 pt-2">
                                                            {article.tags.map((tag: string, i: number) => (
                                                                <span key={i} className="text-xs font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-1 rounded-full">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button variant="ghost" className="text-slate-400 hover:text-cyan-600">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Article Modal */}
                <Modal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    title={isEditMode ? "Edit Knowledge Article" : "Create New Knowledge Article"}
                    size="lg"
                >
                    <form onSubmit={handleCreateOrUpdate} className="space-y-6 p-6">
                        <Input
                            label="Article Title"
                            value={newArticle.title}
                            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                            required
                        />

                        <Select
                            label="Category"
                            name="category"
                            value={newArticle.category}
                            onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                            options={Object.values(KnowledgeCategoryEnum).map(v => ({ value: v, label: v }))}
                            required
                        />

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Content (Markdown supported)
                            </label>
                            <textarea
                                className="w-full h-64 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono text-sm"
                                value={newArticle.content}
                                onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                                required
                            />
                        </div>

                        <Input
                            label="Tags (comma separated)"
                            value={newArticle.tags}
                            onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
                        />

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Attachment (Optional)
                            </label>
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<Paperclip className="w-4 h-4" />}
                                    onClick={() => document.getElementById('kb-file-upload')?.click()}
                                >
                                    Choose File
                                </Button>
                                <input
                                    id="kb-file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setNewArticle({ ...newArticle, file: e.target.files[0] });
                                        }
                                    }}
                                />
                                <span className="text-sm text-slate-500 truncate">
                                    {newArticle.file ? newArticle.file.name : 'No file chosen'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="primary">{isEditMode ? 'Update Article' : 'Publish Knowledge'}</Button>
                        </div>
                    </form>
                </Modal>

                {/* View Article Modal */}
                <Modal
                    isOpen={!!selectedArticle}
                    onClose={() => setSelectedArticle(null)}
                    title={selectedArticle?.title || 'Article Details'}
                    size="lg"
                >
                    {selectedArticle && (
                        <div className="p-6 space-y-6">
                            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
                                    {formatCategory(selectedArticle.category)}
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Last updated: {new Date(selectedArticle.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                                    {selectedArticle.content}
                                </p>
                            </div>

                            {selectedArticle.fileUrl && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <FileText className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Attachment</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{selectedArticle.fileUrl.split('-').slice(1).join('-')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-9 h-9 p-0 aspect-square"
                                            onClick={() => handleView(selectedArticle)}
                                            title="View Attachment"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="w-9 h-9 p-0 aspect-square"
                                            onClick={() => handleDownload(selectedArticle)}
                                            title="Download Attachment"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Related Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedArticle.tags.map((tag: string, i: number) => (
                                            <span key={i} className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                {canManage && (
                                    <Button variant="outline" onClick={() => openEditModal(selectedArticle)}>
                                        Edit Article
                                    </Button>
                                )}
                                <Button variant="primary" onClick={() => setSelectedArticle(null)}>Close Article</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </RouteGuard>
    );
}


export default KnowledgeBasePage;